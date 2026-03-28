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
MODEL = "claude-opus-4-6"


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

    return f"""You are an expert medical-legal report writer assisting a consulting doctor in the UK. You are given a transcript of a recorded consultation between a doctor and a claimant, along with the placeholder field names from a formal medical-legal report template.

Your task is to populate every placeholder by carefully extracting and synthesising information from the transcript.

LANGUAGE & STYLE RULES — follow these strictly:
- Write in formal British English throughout (e.g. "colour" not "color", "organise" not "organize", "whilst" not "while", "licence" not "license").
- Use precise, professional medical-legal language appropriate for a UK medicolegal report.
- Write in the third person. Do NOT use the claimant's name anywhere in descriptive or narrative fields. Refer to them only as "the claimant" (e.g. "The claimant reports...", "The claimant attended..."). The only exception is identity fields such as patient_name, patient_dob, patient_address — those should contain the actual value from the transcript.
- Do not use informal language, contractions, or colloquialisms.

EXTRACTION RULES:
1. Read the transcript carefully.
2. For each placeholder, extract or compose the correct value:
   - String fields: return a plain string value.
   - LIST fields: return a JSON array of strings, one item per bullet point. Each item should be a complete, standalone sentence or phrase.
3. If a placeholder cannot be filled from the transcript, set its value to null.
4. Use ONLY the bare field name (without []) as the JSON key.
5. LIST fields must always have an array value (or null if not found), never a string.

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
      "reason": "brief explanation of why it could not be filled"
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
        max_tokens=16000,
        messages=[{"role": "user", "content": build_prompt(placeholders, transcript)}],
    )
    text = response.content[0].text

    # Strip markdown fences if present
    if "```" in text:
        # Pull out content between the first ``` and last ```
        text = text[text.index("```"):]
        text = text.split("\n", 1)[1] if "\n" in text else text
        text = text.rsplit("```", 1)[0]

    # Fallback: extract raw JSON by finding the outermost { ... }
    text = text.strip()
    if not text.startswith("{"):
        start = text.find("{")
        end = text.rfind("}") + 1
        if start != -1 and end > start:
            text = text[start:end]

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"\nFailed to parse AI response as JSON: {e}")
        print(f"Stop reason: {response.stop_reason}")
        print(f"Raw response (first 500 chars):\n{text[:500]}")
        raise


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
