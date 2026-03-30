"""
MedGen Pipeline — full end-to-end: audio → transcript → filled JSON → report.

Usage:
    python scripts/run_pipeline.py <audio_file> <output_name> [--template path]

Examples:
    python scripts/run_pipeline.py data/audio/Audio1.mp4 "Sandor_Rekettyes"
    python scripts/run_pipeline.py data/audio/Audio1.mp3 "Sandor_Rekettyes"
    python scripts/run_pipeline.py data/audio/Audio1.mp4 "Sandor_Rekettyes" --template templates/Numan_Template.docx
"""

import argparse
import json
import os
import sys
from pathlib import Path

# Allow sibling script imports (convert_audio, transcribe, etc.)
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

TRANSCRIPTS_DIR = PROJECT_ROOT / "output" / "transcripts"
REPORTS_DIR     = PROJECT_ROOT / "output" / "reports"
DEFAULT_TEMPLATE = PROJECT_ROOT / "templates" / "Numan_Template.docx"


def step(title: str):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


def run_pipeline(audio_path: str, output_name: str, template_path: str, keep_unfilled: bool = True):
    audio = Path(audio_path)
    template = Path(template_path)
    output_stem = Path(output_name).stem  # strip .docx if user included it

    TRANSCRIPTS_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # Step 1: Convert MP4 → MP3 (if needed)
    # ------------------------------------------------------------------
    if audio.suffix.lower() == ".mp4":
        step("Step 1/4 — Converting MP4 to MP3")
        from convert_audio import convert_to_mp3
        mp3_path = audio.with_suffix(".mp3")
        convert_to_mp3(str(audio), str(mp3_path))
        os.unlink(audio)
        print(f"Deleted original: {audio}")
        audio = mp3_path
    else:
        print(f"\nStep 1/4 — Skipped (already MP3): {audio.name}")

    # ------------------------------------------------------------------
    # Step 2: Transcribe
    # ------------------------------------------------------------------
    step("Step 2/4 — Transcribing with ElevenLabs")
    from transcribe import transcribe, format_paragraphs, format_utterances

    result = transcribe(str(audio))

    para_text = format_paragraphs(result)
    utt_text  = format_utterances(result)

    para_path = TRANSCRIPTS_DIR / f"{audio.stem}_transcript_paragraphs.txt"
    utt_path  = TRANSCRIPTS_DIR / f"{audio.stem}_transcript_utterances.txt"

    para_path.write_text(para_text, encoding="utf-8")
    utt_path.write_text(utt_text, encoding="utf-8")

    words     = result.get("words", [])
    speakers  = {w.get("speaker_id") for w in words if w.get("speaker_id")}
    duration  = max((w.get("end", 0) for w in words), default=0)

    print(f"  Duration:          {duration:.1f}s ({duration/60:.1f} min)")
    print(f"  Speakers detected: {len(speakers)}")
    print(f"  Transcript saved:  {para_path.name}  (using paragraphs format)")

    # ------------------------------------------------------------------
    # Step 3: Extract placeholders + fill with AI
    # ------------------------------------------------------------------
    step("Step 3/4 — Filling placeholders with AI")
    import fill_placeholders as fp

    placeholders = fp.extract_placeholders(str(template))
    list_count   = sum(1 for p in placeholders if p.endswith("[]"))
    print(f"  Placeholders found: {len(placeholders)} ({list_count} list fields)")
    print("  Sending to Claude Opus...\n")

    filled_data = fp.fill_placeholders(placeholders, para_text)

    filled  = filled_data.get("filled", {})
    unfilled = filled_data.get("unfilled", [])
    filled_count = sum(1 for v in filled.values() if v is not None and v != [] and v != "")
    print(f"\n  Filled:   {filled_count}/{len(placeholders)}")
    print(f"  Unfilled: {len(unfilled)}/{len(placeholders)}")

    if unfilled:
        print("\n  Unfilled placeholders (will be kept in report):" if keep_unfilled
              else "\n  Unfilled placeholders (will be left blank):")
        for item in unfilled:
            print(f"    • {{{{{item['placeholder']}}}}} — {item['reason']}")

    json_path = REPORTS_DIR / f"{output_stem}_filled.json"
    json_path.write_text(json.dumps(filled_data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n  JSON saved: {json_path.name}")

    # ------------------------------------------------------------------
    # Step 4: Generate report
    # ------------------------------------------------------------------
    step("Step 4/4 — Generating report")
    from generate_report import generate_report

    report_path = REPORTS_DIR / f"{output_stem}.docx"
    generate_report(str(template), str(json_path), str(report_path), keep_unfilled)

    # ------------------------------------------------------------------
    # Done
    # ------------------------------------------------------------------
    print(f"\n{'='*60}")
    print("  PIPELINE COMPLETE")
    print(f"{'='*60}")
    print(f"  Report:     {report_path}")
    print(f"  JSON data:  {json_path}")
    print(f"  Transcript: {para_path}")
    print()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="MedGen full pipeline: audio → transcript → filled JSON → report",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("audio_file",   help="Path to audio file (.mp3 or .mp4)")
    parser.add_argument("output_name",  help="Output report name (e.g. 'Sandor_Rekettyes')")
    parser.add_argument("--template",   default=str(DEFAULT_TEMPLATE),
                        help=f"Path to .docx template (default: {DEFAULT_TEMPLATE})")
    parser.add_argument("--fill-unfilled", dest="keep_unfilled", action="store_false",
                        help="Leave unfilled placeholders blank instead of keeping them visible")
    parser.set_defaults(keep_unfilled=True)

    args = parser.parse_args()
    run_pipeline(args.audio_file, args.output_name, args.template, args.keep_unfilled)
