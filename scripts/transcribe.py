"""Transcribe a medical audio recording using Deepgram with speaker diarization."""

import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from deepgram import DeepgramClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")
OUTPUT_DIR = PROJECT_ROOT / "output" / "transcripts"


def transcribe(audio_path: str, language: str = "en-GB") -> dict:
    client = DeepgramClient(api_key=os.environ["DEEPGRAM_API_KEY"])

    with open(audio_path, "rb") as f:
        buffer = f.read()

    print(f"Transcribing {audio_path}...")
    response = client.listen.v1.media.transcribe_file(
        request=buffer,
        model="nova-3-medical",
        language=language,
        smart_format=True,
        punctuate=True,
        diarize=True,
        utterances=True,
        paragraphs=True,
    )
    return response.dict()


def format_utterances(result: dict) -> str:
    """Format as speaker-labeled dialogue."""
    lines = []
    for utt in result["results"]["utterances"]:
        speaker = f"Speaker {utt['speaker']}"
        text = utt["transcript"]
        lines.append(f"{speaker}: {text}")
    return "\n\n".join(lines)


def format_paragraphs(result: dict) -> str:
    """Format using Deepgram's paragraph detection."""
    paragraphs = result["results"]["channels"][0]["alternatives"][0]["paragraphs"]
    lines = []
    for para in paragraphs["paragraphs"]:
        speaker = f"Speaker {para['speaker']}"
        sentences = " ".join(s["text"] for s in para["sentences"])
        lines.append(f"{speaker}: {sentences}")
    return "\n\n".join(lines)


def main():
    if len(sys.argv) < 2:
        print("Usage: python transcribe.py <audio_file> [language]")
        print("  language: en-GB (default), en-US, etc.")
        sys.exit(1)

    audio_path = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else "en-GB"
    stem = Path(audio_path).stem

    result = transcribe(audio_path, language)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Save raw JSON response
    raw_path = OUTPUT_DIR / f"{stem}_deepgram_raw.json"
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
    metadata = result.get("metadata", {})
    duration = metadata.get("duration", 0)
    num_speakers = len({u["speaker"] for u in result["results"]["utterances"]})
    num_utterances = len(result["results"]["utterances"])

    print(f"\n--- Summary ---")
    print(f"  Duration: {duration:.1f}s ({duration/60:.1f} min)")
    print(f"  Speakers detected: {num_speakers}")
    print(f"  Utterances: {num_utterances}")
    print(f"\nOutputs saved to {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
