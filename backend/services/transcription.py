"""
Transcription service — ElevenLabs Scribe V2 with speaker diarization.
Logic ported from extras/scripts/transcribe.py.
"""
import asyncio
import tempfile
import os
from backend.config import get_settings


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


async def transcribe_bytes(audio_bytes: bytes, filename: str = "audio.mp3", language: str = "en", num_speakers: int = 2) -> dict:
    """
    Transcribe raw audio bytes.
    Returns {raw_json, paragraphs_text, utterances_text}.
    """
    settings = get_settings()

    def _run():
        from elevenlabs import ElevenLabs
        client = ElevenLabs(api_key=settings.elevenlabs_api_key)

        # Write to temp file — ElevenLabs SDK needs a file-like object with a name
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
            return response.model_dump()
        finally:
            os.unlink(tmp_path)

    raw = await asyncio.to_thread(_run)
    return {
        "raw_json": raw,
        "paragraphs_text": _format_paragraphs(raw),
        "utterances_text": _format_utterances(raw),
    }
