"""Fill docx placeholders from a medical transcript using AI."""

import json
import sys
from pathlib import Path

from dotenv import load_dotenv
from anthropic import Anthropic

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

from extract_placeholders import extract_placeholders

client = Anthropic()
MODEL = "claude-sonnet-4-6"


def _is_list_field(name: str) -> bool:
    return name.endswith("[]")


def _strip_brackets(name: str) -> str:
    return name[:-2] if name.endswith("[]") else name


def build_prompt(placeholders: list[str], transcript: str) -> str:
    lines = []
    for p in placeholders:
        if _is_list_field(p):
            lines.append(f'- {_strip_brackets(p)}  (LIST field — return a JSON array of strings, one item per bullet point)')
        else:
            lines.append(f"- {p}  (return a string)")
    placeholder_list = "\n".join(lines)

    return f"""You are a medical report assistant. You are given a transcript from a recording between a doctor and a claimant/patient, along with a list of placeholder field names from a report template.

Your job:
1. Read the transcript carefully.
2. For each placeholder, extract the correct value from the transcript.
   - String fields: return a plain string value.
   - LIST fields: return a JSON array of strings (one element per bullet point).
3. If a placeholder cannot be filled from the transcript, set its value to null.

IMPORTANT:
- Use ONLY the bare field name (without []) as the JSON key.
- LIST fields must always have an array value (or null if not found), never a string.

Return ONLY valid JSON with this exact structure:
{{
  "filled": {{
    "placeholder_name": "string value",
    "list_field_name": ["item 1", "item 2", "item 3"],
    ...
  }},
  "unfilled": [
    {{
      "placeholder": "placeholder_name",
      "reason": "brief explanation of why it couldn't be filled"
    }},
    ...
  ]
}}

PLACEHOLDERS:
{placeholder_list}

TRANSCRIPT:
{transcript}"""


def fill_placeholders(placeholders: list[str], transcript: str) -> dict:
    response = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        messages=[{"role": "user", "content": build_prompt(placeholders, transcript)}],
    )
    text = response.content[0].text

    # Strip markdown fences if present
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0]

    return json.loads(text)


def main():
    if len(sys.argv) < 3:
        print("Usage: python fill_placeholders.py <template.docx> <transcript.txt>")
        sys.exit(1)

    docx_path = sys.argv[1]
    transcript_path = sys.argv[2]

    transcript = Path(transcript_path).read_text(encoding="utf-8")
    placeholders = extract_placeholders(docx_path)

    print(f"Found {len(placeholders)} placeholder(s) in template.")
    print("Sending to AI...\n")

    result = fill_placeholders(placeholders, transcript)

    # Display filled
    filled = result.get("filled", {})
    unfilled = result.get("unfilled", [])

    print(f"--- Filled ({len(filled) - len(unfilled)}/{len(placeholders)}) ---")
    for key, val in filled.items():
        if val is None:
            continue
        if isinstance(val, list):
            print(f"  {{{{{key}}}}} -> [{len(val)} items]")
            for item in val:
                print(f"    • {item}")
        else:
            print(f"  {{{{{key}}}}} -> {val}")

    # Display unfilled
    if unfilled:
        print(f"\n--- Unfilled ({len(unfilled)}/{len(placeholders)}) ---")
        for item in unfilled:
            print(f"  {{{{{item['placeholder']}}}}} — {item['reason']}")

    # Save JSON output
    output_dir = PROJECT_ROOT / "output" / "reports"
    output_dir.mkdir(parents=True, exist_ok=True)
    out_path = output_dir / (Path(docx_path).stem + "_filled.json")
    out_path.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nJSON saved to {out_path}")


if __name__ == "__main__":
    main()
