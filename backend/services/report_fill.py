"""
Report fill service — uses Claude to fill DOCX template placeholders.
Logic ported from extras/scripts/fill_placeholders.py.
"""
import asyncio
import json
from backend.config import get_settings


def _is_list_field(name: str) -> bool:
    return name.endswith("[]")


def _strip_brackets(name: str) -> str:
    return name[:-2] if name.endswith("[]") else name


def _build_prompt(placeholders: list[str], transcript: str) -> str:
    lines = []
    for p in placeholders:
        if _is_list_field(p):
            lines.append(f"- {_strip_brackets(p)}  (LIST field — return a JSON array of strings, one item per bullet point)")
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


def _extract_json(text: str) -> dict:
    if "```" in text:
        text = text[text.index("```"):]
        text = text.split("\n", 1)[1] if "\n" in text else text
        text = text.rsplit("```", 1)[0]
    text = text.strip()
    if not text.startswith("{"):
        start = text.find("{")
        end = text.rfind("}") + 1
        if start != -1 and end > start:
            text = text[start:end]
    return json.loads(text)


async def fill_placeholders(placeholders: list[str], transcript: str) -> dict:
    """
    Fill template placeholders from transcript using Claude.
    Returns {filled: {name: value}, unfilled: [{placeholder, reason}]}.
    """
    settings = get_settings()

    def _run():
        from anthropic import Anthropic
        client = Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model=settings.ai_model,
            max_tokens=16000,
            messages=[{"role": "user", "content": _build_prompt(placeholders, transcript)}],
        )
        return _extract_json(response.content[0].text)

    return await asyncio.to_thread(_run)
