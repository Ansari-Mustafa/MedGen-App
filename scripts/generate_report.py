"""Generate a filled .docx report from a template and a filled JSON."""

import argparse
import copy
import json
import os
import re
import tempfile
from pathlib import Path

from docx import Document
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docxtpl import DocxTemplate

PROJECT_ROOT = Path(__file__).resolve().parent.parent

LIST_FIELD_RE = re.compile(r"\{\{-?\s*(\w+)\[\]\s*-?\}\}")


# ---------------------------------------------------------------------------
# Template pre-processor: {{ field[] }} → {%p for %} / {{ item }} / {%p endfor %}
# ---------------------------------------------------------------------------

def _para_full_text(para_elem) -> str:
    return "".join(t.text or "" for t in para_elem.iter(qn("w:t")))


def _set_para_text(para_elem, text: str, remove_list_style: bool = False):
    """Replace all runs in a paragraph XML element with a single text run."""
    for tag in [qn("w:r"), qn("w:hyperlink"), qn("w:ins"), qn("w:del")]:
        for child in para_elem.findall(tag):
            para_elem.remove(child)

    r = OxmlElement("w:r")
    t = OxmlElement("w:t")
    t.text = text
    r.append(t)
    para_elem.append(r)

    if remove_list_style:
        pPr = para_elem.find(qn("w:pPr"))
        if pPr is not None:
            for tag in [qn("w:pStyle"), qn("w:numPr")]:
                el = pPr.find(tag)
                if el is not None:
                    pPr.remove(el)


def _transform_list_placeholders(root_elem) -> int:
    """
    Find all {{ field[] }} paragraphs under root_elem and rewrite them as:
        {%p for item in field %}   ← new paragraph (no bullet style)
        {{ item }}                 ← original paragraph (keeps bullet style)
        {%p endfor %}              ← new paragraph (no bullet style)
    Returns count of transformed placeholders.
    """
    to_transform = []
    for para_el in root_elem.findall(".//" + qn("w:p")):
        m = LIST_FIELD_RE.search(_para_full_text(para_el))
        if m:
            to_transform.append((para_el, m.group(1)))

    for para_el, field_name in to_transform:
        parent = para_el.getparent()
        if parent is None:
            continue
        idx = list(parent).index(para_el)

        for_elem = copy.deepcopy(para_el)
        _set_para_text(for_elem, "{%p for item in " + field_name + " %}", remove_list_style=True)

        _set_para_text(para_el, "{{ item }}", remove_list_style=False)

        endfor_elem = copy.deepcopy(para_el)
        _set_para_text(endfor_elem, "{%p endfor %}", remove_list_style=True)

        parent.insert(idx, for_elem)       # for_elem before para_el
        parent.insert(idx + 2, endfor_elem)  # endfor_elem after para_el

    return len(to_transform)


def preprocess_template(template_path: str) -> tuple[str, bool]:
    """
    Pre-process the template to convert {{ field[] }} to docxtpl loop syntax.
    Returns (path, was_modified). If modified, path is a temp file — caller must delete it.
    """
    doc = Document(template_path)
    count = _transform_list_placeholders(doc.element.body)

    if count == 0:
        return template_path, False

    fd, tmp_path = tempfile.mkstemp(suffix=".docx")
    os.close(fd)
    doc.save(tmp_path)
    return tmp_path, True


# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------

def generate_report(template_path: str, json_path: str, output_path: str | None = None, keep_unfilled: bool = False):
    data = json.loads(Path(json_path).read_text(encoding="utf-8"))
    unfilled_keys = {item["placeholder"] for item in data.get("unfilled", [])}

    context = {}
    for k, v in data["filled"].items():
        if v is None:
            if keep_unfilled:
                context[k] = ["{{ " + k + "[] }}"] if _is_known_list(k, data) else "{{" + k + "}}"
            else:
                context[k] = [] if _is_known_list(k, data) else ""
        else:
            context[k] = v

    # Placeholders only in unfilled list
    for key in unfilled_keys:
        if key not in context:
            context[key] = "{{" + key + "}}" if keep_unfilled else ""

    # Pre-process template: rewrite {{ field[] }} as Jinja2 loops
    processed_path, was_modified = preprocess_template(template_path)

    try:
        tpl = DocxTemplate(processed_path)
        tpl.render(context)

        if output_path is None:
            output_dir = PROJECT_ROOT / "output" / "reports"
            output_dir.mkdir(parents=True, exist_ok=True)
            stem = Path(template_path).stem.replace("_Template", "").replace("_template", "")
            output_path = str(output_dir / f"{stem}_Report.docx")

        tpl.save(output_path)
        print(f"Report saved to {output_path}")

    finally:
        if was_modified:
            os.unlink(processed_path)

    if unfilled_keys:
        action = "kept as placeholders" if keep_unfilled else "left blank"
        print(f"\nWarning: {len(unfilled_keys)} placeholder(s) were not filled ({action}):")
        for item in data["unfilled"]:
            print(f"  {{{{{item['placeholder']}}}}} — {item['reason']}")


def _is_known_list(key: str, data: dict) -> bool:
    """Check if a key is expected to be a list (value was previously a list)."""
    val = data["filled"].get(key)
    return isinstance(val, list)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate a filled .docx report from a template and JSON.")
    parser.add_argument("template", help="Path to the .docx template")
    parser.add_argument("json_file", help="Path to the filled JSON")
    parser.add_argument("-o", "--output", help="Output .docx path (default: output/reports/<name>_Report.docx)")
    parser.add_argument("--keep-unfilled", action="store_true", help="Keep {{placeholder}} text for unfilled values")
    args = parser.parse_args()

    generate_report(args.template, args.json_file, args.output, args.keep_unfilled)
