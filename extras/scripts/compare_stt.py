"""Compare speech-to-text services side by side on the same audio file."""

import json
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")
RESULTS_DIR = PROJECT_ROOT / "output" / "stt_comparison"


def transcribe_deepgram(audio_path: str) -> dict:
    """Deepgram Nova-3 Medical with diarization."""
    from deepgram import DeepgramClient

    client = DeepgramClient(api_key=os.environ["DEEPGRAM_API_KEY"])

    with open(audio_path, "rb") as f:
        buffer = f.read()

    response = client.listen.v1.media.transcribe_file(
        request=buffer,
        model="nova-3-medical",
        language="en-GB",
        smart_format=True,
        punctuate=True,
        diarize=True,
        utterances=True,
        paragraphs=True,
    )
    result = response.dict()

    # Format as speaker-labeled text
    lines = []
    for utt in result["results"]["utterances"]:
        lines.append(f"Speaker {utt['speaker']}: {utt['transcript']}")

    return {
        "service": "Deepgram",
        "model": "nova-3-medical",
        "transcript": "\n\n".join(lines),
        "raw": result,
        "speakers": len({u["speaker"] for u in result["results"]["utterances"]}),
        "utterances": len(result["results"]["utterances"]),
    }


def transcribe_openai(audio_path: str) -> dict:
    """OpenAI GPT-4o Transcribe with diarization."""
    from openai import OpenAI

    client = OpenAI()  # uses OPENAI_API_KEY

    with open(audio_path, "rb") as f:
        response = client.audio.transcriptions.create(
            file=f,
            model="gpt-4o-transcribe-diarize",
            response_format="json",
            chunking_strategy="auto",
        )

    result = response.model_dump() if hasattr(response, "model_dump") else {"text": response}

    # Diarized response has a "words" list with speaker labels
    words = result.get("words", [])
    if words:
        lines = []
        current_speaker = None
        current_text = []
        for w in words:
            speaker = w.get("speaker", "?")
            if speaker != current_speaker and current_text:
                lines.append(f"Speaker {current_speaker}: {' '.join(current_text)}")
                current_text = []
            current_speaker = speaker
            current_text.append(w.get("word", ""))
        if current_text:
            lines.append(f"Speaker {current_speaker}: {' '.join(current_text)}")
        speakers = {w.get("speaker") for w in words if w.get("speaker")}
    else:
        # Fallback: plain text, no diarization in response
        lines = [result.get("text", "")]
        speakers = set()

    return {
        "service": "OpenAI",
        "model": "gpt-4o-transcribe-diarize",
        "transcript": "\n\n".join(lines),
        "raw": result,
        "speakers": len(speakers),
        "utterances": len(lines),
    }


def transcribe_gemini(audio_path: str) -> dict:
    """Google Gemini 2.5 Pro — prompt-based diarization."""
    from google import genai
    from google.genai import types

    client = genai.Client()  # uses GOOGLE_API_KEY

    with open(audio_path, "rb") as f:
        audio_bytes = f.read()

    mime_map = {".mp3": "audio/mp3", ".wav": "audio/wav", ".m4a": "audio/mp4", ".mp4": "audio/mp4"}
    ext = Path(audio_path).suffix.lower()
    mime = mime_map.get(ext, "audio/mpeg")

    response = client.models.generate_content(
        model="gemini-2.5-pro",
        contents=[
            types.Part.from_bytes(data=audio_bytes, mime_type=mime),
            "Transcribe this audio verbatim with speaker diarization. "
            "Label speakers as Speaker 0, Speaker 1, etc. Format each turn as:\n"
            "Speaker X: <text>\n\n"
            "Separate each speaker turn with a blank line. "
            "Preserve all medical terminology exactly as spoken. "
            "Do not summarise — transcribe every word.",
        ],
    )

    text = response.text
    # Count speakers from output
    import re
    speakers = set(re.findall(r"Speaker (\d+)", text))

    return {
        "service": "Google Gemini",
        "model": "gemini-2.5-pro",
        "transcript": text,
        "raw": {"text": text},
        "speakers": len(speakers),
        "utterances": text.count("Speaker "),
    }


def transcribe_elevenlabs(audio_path: str) -> dict:
    """ElevenLabs Scribe V2 with diarization."""
    from elevenlabs import ElevenLabs

    client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])

    with open(audio_path, "rb") as f:
        result = client.speech_to_text.convert(
            file=f,
            model_id="scribe_v2",
            diarize=True,
            language_code="en",
            tag_audio_events=True,
            timestamps_granularity="word",
            num_speakers=2,
        )

    result_dict = result.dict() if hasattr(result, "dict") else result.model_dump()

    # Group words by speaker into utterances
    lines = []
    current_speaker = None
    current_words = []
    for word in result_dict.get("words", []):
        speaker = word.get("speaker_id", "?")
        if speaker != current_speaker and current_words:
            lines.append(f"Speaker {current_speaker}: {' '.join(current_words)}")
            current_words = []
        current_speaker = speaker
        text = word.get("text", "")
        if text:
            current_words.append(text)
    if current_words:
        lines.append(f"Speaker {current_speaker}: {' '.join(current_words)}")

    speakers = {w.get("speaker_id") for w in result_dict.get("words", []) if w.get("speaker_id")}

    return {
        "service": "ElevenLabs",
        "model": "scribe_v2",
        "transcript": "\n\n".join(lines),
        "raw": result_dict,
        "speakers": len(speakers),
        "utterances": len(lines),
    }


def transcribe_assemblyai(audio_path: str) -> dict:
    """AssemblyAI Universal-3 Pro with speaker labels."""
    import assemblyai as aai

    aai.settings.api_key = os.environ["ASSEMBLYAI_API_KEY"]

    config = aai.TranscriptionConfig(
        speaker_labels=True,
        language_detection=True,
    )

    transcriber = aai.Transcriber()
    transcript = transcriber.transcribe(audio_path, config=config)

    if transcript.status == aai.TranscriptStatus.error:
        raise RuntimeError(f"AssemblyAI error: {transcript.error}")

    lines = []
    speakers = set()
    for utt in transcript.utterances:
        lines.append(f"Speaker {utt.speaker}: {utt.text}")
        speakers.add(utt.speaker)

    return {
        "service": "AssemblyAI",
        "model": "universal-3-pro",
        "transcript": "\n\n".join(lines),
        "raw": {"text": transcript.text, "utterances": [{"speaker": u.speaker, "text": u.text} for u in transcript.utterances]},
        "speakers": len(speakers),
        "utterances": len(lines),
    }


# Map of service name -> (function, required env var)
SERVICES = {
    "deepgram": (transcribe_deepgram, "DEEPGRAM_API_KEY"),
    "openai": (transcribe_openai, "OPENAI_API_KEY"),
    "gemini": (transcribe_gemini, "GOOGLE_API_KEY"),
    "elevenlabs": (transcribe_elevenlabs, "ELEVENLABS_API_KEY"),
    "assemblyai": (transcribe_assemblyai, "ASSEMBLYAI_API_KEY"),
}


def main():
    if len(sys.argv) < 2:
        print("Usage: python compare_stt.py <audio_file> [service1,service2,...]")
        print(f"  Available services: {', '.join(SERVICES.keys())}")
        print("  Omit services to run all that have API keys in .env")
        sys.exit(1)

    audio_path = sys.argv[1]
    stem = Path(audio_path).stem

    # Determine which services to run
    if len(sys.argv) > 2:
        requested = [s.strip().lower() for s in sys.argv[2].split(",")]
    else:
        requested = list(SERVICES.keys())

    RESULTS_DIR.mkdir(exist_ok=True)

    results = []
    for name in requested:
        if name not in SERVICES:
            print(f"Unknown service: {name}")
            continue

        func, env_var = SERVICES[name]
        if not os.environ.get(env_var):
            print(f"Skipping {name} — {env_var} not set in .env")
            continue

        print(f"\n{'='*50}")
        print(f"Running {name}...")
        print(f"{'='*50}")

        try:
            start = time.time()
            result = func(audio_path)
            elapsed = time.time() - start
            result["time_seconds"] = round(elapsed, 1)

            # Save individual transcript
            txt_path = RESULTS_DIR / f"{stem}_{name}.txt"
            txt_path.write_text(result["transcript"], encoding="utf-8")

            # Save raw response
            raw_path = RESULTS_DIR / f"{stem}_{name}_raw.json"
            raw_path.write_text(json.dumps(result["raw"], indent=2, ensure_ascii=False, default=str), encoding="utf-8")

            print(f"  Time: {result['time_seconds']}s")
            print(f"  Speakers: {result['speakers']}")
            print(f"  Utterances: {result['utterances']}")
            print(f"  Saved: {txt_path}")

            results.append(result)

        except Exception as e:
            print(f"  FAILED: {e}")
            results.append({"service": name, "error": str(e)})

    # Print comparison summary
    if results:
        print(f"\n{'='*50}")
        print("COMPARISON SUMMARY")
        print(f"{'='*50}")
        print(f"{'Service':<15} {'Model':<30} {'Time':>6} {'Speakers':>9} {'Utterances':>11}")
        print("-" * 75)
        for r in results:
            if "error" in r:
                print(f"{r['service']:<15} {'FAILED':<30} {r['error']}")
            else:
                print(f"{r['service']:<15} {r['model']:<30} {r['time_seconds']:>5}s {r['speakers']:>9} {r['utterances']:>11}")

        print(f"\nAll transcripts saved in {RESULTS_DIR}/")
        print("Compare the .txt files side by side to judge quality.")


if __name__ == "__main__":
    main()
