"""Transcribe a medical audio recording using ElevenLabs Scribe V2 with speaker diarization."""

import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from elevenlabs import ElevenLabs

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")
OUTPUT_DIR = PROJECT_ROOT / "output" / "transcripts"


def transcribe(audio_path: str, language: str = "en", num_speakers: int = 2) -> dict:
    client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])

    print(f"Transcribing {audio_path}...")
    with open(audio_path, "rb") as f:
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


def format_utterances(result: dict) -> str:
    """Format as speaker-labeled turns — one line per speaker change."""
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


def format_paragraphs(result: dict) -> str:
    """
    Group consecutive words by speaker into paragraph blocks.
    A new paragraph starts when the speaker changes or there is a
    gap of more than 2 seconds between words.
    """
    words = result.get("words", [])
    if not words:
        return result.get("text", "")

    paragraphs = []
    current_speaker = None
    current_words = []
    prev_end = None
    GAP_THRESHOLD = 2.0  # seconds

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


def main():
    if len(sys.argv) < 2:
        print("Usage: python transcribe.py <audio_file> [language] [num_speakers]")
        print("  language:     en (default), en-GB, fr, de, etc.")
        print("  num_speakers: 2 (default)")
        sys.exit(1)

    audio_path = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else "en"
    num_speakers = int(sys.argv[3]) if len(sys.argv) > 3 else 2
    stem = Path(audio_path).stem

    result = transcribe(audio_path, language, num_speakers)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Save raw JSON response
    raw_path = OUTPUT_DIR / f"{stem}_elevenlabs_raw.json"
    raw_path.write_text(json.dumps(result, indent=2, ensure_ascii=False, default=str), encoding="utf-8")
    print(f"Raw response saved to {raw_path}")

    # Save utterance-based transcript
    utt_text = format_utterances(result)
    utt_path = OUTPUT_DIR / f"{stem}_transcript_utterances.txt"
    utt_path.write_text(utt_text, encoding="utf-8")
    print(f"Utterance transcript saved to {utt_path}")

    # Save paragraph-based transcript
    para_text = format_paragraphs(result)
    para_path = OUTPUT_DIR / f"{stem}_transcript_paragraphs.txt"
    para_path.write_text(para_text, encoding="utf-8")
    print(f"Paragraph transcript saved to {para_path}")

    # Summary
    words = result.get("words", [])
    speakers = {w.get("speaker_id") for w in words if w.get("speaker_id")}
    duration = max((w.get("end", 0) for w in words), default=0)

    print(f"\n--- Summary ---")
    print(f"  Duration:          {duration:.1f}s ({duration / 60:.1f} min)")
    print(f"  Speakers detected: {len(speakers)}")
    print(f"  Words:             {len(words)}")
    print(f"\nOutputs saved to {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
