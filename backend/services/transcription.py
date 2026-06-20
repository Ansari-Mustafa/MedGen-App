"""
Transcription service.

Primary: ElevenLabs Scribe V2 with speaker diarization (per-word timestamps).
Fallback: Google Gemini 2.5 Pro (prompt-based diarization, no timestamps).

The fallback fires automatically on any ElevenLabs error (quota, network, etc.)
when settings.stt_fallback_to_gemini is True and GOOGLE_API_KEY is set.
"""
import asyncio
import logging
import os
import re
import tempfile
from backend.config import get_settings

logger = logging.getLogger("medgen.transcription")


def _format_paragraphs(result: dict) -> str:
    words = result.get("words", [])
    if not words:
        return result.get("text", "")

    paragraphs = []
    current_speaker = None
    current_words = []
    prev_end = None
    GAP_THRESHOLD = 2.0

    for word in words:
        speaker = word.get("speaker_id", "?")
        text = word.get("text", "").strip()
        start = word.get("start", 0)
        end = word.get("end", 0)
        if not text:
            continue

        speaker_changed = speaker != current_speaker
        long_gap = prev_end is not None and (start - prev_end) > GAP_THRESHOLD

        if (speaker_changed or long_gap) and current_words:
            paragraphs.append(f"Speaker {current_speaker}: {' '.join(current_words)}")
            current_words = []

        current_speaker = speaker
        current_words.append(text)
        prev_end = end

    if current_words:
        paragraphs.append(f"Speaker {current_speaker}: {' '.join(current_words)}")

    return "\n\n".join(paragraphs)


def _format_utterances(result: dict) -> str:
    lines = []
    current_speaker = None
    current_words = []

    for word in result.get("words", []):
        speaker = word.get("speaker_id", "?")
        text = word.get("text", "").strip()
        if not text:
            continue
        if speaker != current_speaker and current_words:
            lines.append(f"Speaker {current_speaker}: {' '.join(current_words)}")
            current_words = []
        current_speaker = speaker
        current_words.append(text)

    if current_words:
        lines.append(f"Speaker {current_speaker}: {' '.join(current_words)}")

    return "\n\n".join(lines)


def _mime_for(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    return {
        ".mp3": "audio/mp3",
        ".wav": "audio/wav",
        ".m4a": "audio/mp4",
        ".mp4": "audio/mp4",
        ".webm": "audio/webm",
        ".ogg": "audio/ogg",
    }.get(ext, "audio/mpeg")


def _transcribe_elevenlabs_sync(audio_bytes: bytes, filename: str, language: str, num_speakers: int) -> dict:
    settings = get_settings()
    from elevenlabs import ElevenLabs
    client = ElevenLabs(api_key=settings.elevenlabs_api_key)

    suffix = os.path.splitext(filename)[1] or ".mp3"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as f:
            response = client.speech_to_text.convert(
                file=f,
                model_id="scribe_v2",
                language_code=language,
                diarize=True,
                num_speakers=num_speakers,
                tag_audio_events=True,
                timestamps_granularity="word",
            )
        raw = response.model_dump()
    finally:
        os.unlink(tmp_path)

    return {
        "raw_json": raw,
        "paragraphs_text": _format_paragraphs(raw),
        "utterances_text": _format_utterances(raw),
        "provider": "elevenlabs",
    }


def _transcribe_gemini_sync(audio_bytes: bytes, filename: str) -> dict:
    """Google Gemini 2.5 Pro with prompt-based diarization. No per-word timestamps."""
    settings = get_settings()
    if not settings.google_api_key:
        raise RuntimeError("GOOGLE_API_KEY is not set; cannot use Gemini fallback.")

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.google_api_key)

    response = client.models.generate_content(
        model="gemini-2.5-pro",
        contents=[
            types.Part.from_bytes(data=audio_bytes, mime_type=_mime_for(filename)),
            "Transcribe this audio verbatim with speaker diarization. "
            "Label speakers as Speaker 0, Speaker 1, etc. Format each turn as:\n"
            "Speaker X: <text>\n\n"
            "Separate each speaker turn with a blank line. "
            "Preserve all medical terminology exactly as spoken. "
            "Do not summarise — transcribe every word.",
        ],
    )

    text = (response.text or "").strip()
    if not text:
        raise RuntimeError("Gemini returned an empty transcript.")

    speakers = set(re.findall(r"Speaker (\d+)", text))
    raw = {
        "text": text,
        "speakers": sorted(speakers),
        "model": "gemini-2.5-pro",
    }
    return {
        "raw_json": raw,
        "paragraphs_text": text,
        "utterances_text": text,
        "provider": "gemini",
    }


async def transcribe_bytes(
    audio_bytes: bytes,
    filename: str = "audio.mp3",
    language: str = "en",
    num_speakers: int = 2,
) -> dict:
    """
    Transcribe raw audio bytes.
    Returns {raw_json, paragraphs_text, utterances_text, provider}.

    Tries ElevenLabs first; on any error, falls back to Gemini if
    settings.stt_fallback_to_gemini is True and GOOGLE_API_KEY is set.
    """
    settings = get_settings()

    try:
        return await asyncio.to_thread(
            _transcribe_elevenlabs_sync, audio_bytes, filename, language, num_speakers
        )
    except Exception as primary_err:
        if not settings.stt_fallback_to_gemini or not settings.google_api_key:
            raise
        logger.warning(
            "ElevenLabs transcription failed (%s); falling back to Gemini.",
            primary_err,
        )
        try:
            return await asyncio.to_thread(_transcribe_gemini_sync, audio_bytes, filename)
        except Exception as fallback_err:
            logger.error("Gemini fallback also failed: %s", fallback_err)
            raise RuntimeError(
                f"Transcription failed. Primary (ElevenLabs): {primary_err}. "
                f"Fallback (Gemini): {fallback_err}"
            ) from fallback_err
