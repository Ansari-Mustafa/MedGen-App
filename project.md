# MedGen — AI-Powered Medical-Legal Report Generation

## Overview

MedGen automates medical-legal report writing. A doctor records their session with a claimant/patient, and the system produces a fully formatted report in the doctor's own writing style — preserving their template formatting, terminology, and structural preferences.

**Core principle:** AI produces structured JSON data. It never touches document formatting. The `.docx` template stays in Word-land end-to-end, so every margin, border, header, footer, and style survives untouched.

The system has two pipelines:

1. **Onboarding** — runs once per doctor. Ingests their past reports, learns their style, builds their template.
2. **Report Generation** — runs per session. Takes audio/transcript → produces a finished report.

Plus a persistent **Data Layer** that stores everything and powers a feedback loop for continuous improvement.

---

## Current State (Prototype)

Three scripts that validate the core pipeline end-to-end:

| Script | Purpose | Key Lib |
|---|---|---|
| `extract_placeholders.py` | Regex-extracts all `{{placeholder}}` names from a `.docx` (paragraphs, tables, headers/footers) | `python-docx` |
| `fill_placeholders.py` | Sends placeholders + transcript to Claude → returns JSON with filled values and unfilled flags with reasons | `anthropic` |
| `generate_report.py` | Renders the template with filled JSON via Jinja2. `--keep-unfilled` flag preserves `{{placeholder}}` text for unfilled values | `docxtpl` |

**Prototype workflow:**
```
Template (.docx) → extract_placeholders → list of fields
                                            ↓ (+ transcript.txt)
                                       fill_placeholders → Claude AI
                                            ↓
                                       filled.json
                                            ↓ (+ template)
                                       generate_report → Final Report (.docx)
```

---

## Data Layer

### Per-Doctor
- **DOCX template** — the approved Jinja2 template file (their formatting, their layout)
- **Doctor profile** (JSON) — writing style descriptors, recurring phrases, boilerplate text, terminology preferences, report length tendency, bullet style
- **Pydantic schema** — defines the template's variables with types and validation rules

Example doctor profile:
```json
{
  "writing_style": "formal, third-person, uses hedging language",
  "recurring_phrases": [
    "It is this clinician's opinion that...",
    "On the balance of probabilities..."
  ],
  "terminology_preferences": {
    "uses": "affect",
    "avoids": "mood"
  },
  "report_length_tendency": "detailed, typically 1500-2500 words",
  "bullet_style": "short declarative statements, no sub-bullets"
}
```

### Per-Patient
- Demographics: name, DOB, address, NINO, occupation
- Case reference numbers (solicitor ref, agency ref)
- Linked sessions

### Per-Session
- Raw audio file (stored immediately before any processing)
- Timestamped, speaker-labeled transcript
- AI-generated structured JSON (the fill output)
- Rendered report (.docx)
- Doctor edits / corrections (diff between AI output and approved version — this is the feedback gold)

---

## Pipeline 1 — Doctor Onboarding

### Step 1: Document Ingestion

Doctor uploads 2–3 past reports. DOCX preferred (full formatting fidelity). PDF accepted but flagged as lossy.

For each document, extract two things:
- **Content** — text, section headings, bullet points, table data
- **Structure** — margins, fonts, header/footer, page layout, section order

Use `python-docx` to walk the document tree for DOCX files. Use `pymupdf` or `pdfplumber` for PDFs.

### Step 2: AI Analysis — "Template Architect" Agent

Feed all extracted content to the LLM with a structured prompt. The agent identifies:

- **Common document structure** across all samples (which sections always appear, in what order)
- **Static/boilerplate content** (letterhead, standard disclaimers, signature blocks → goes directly into template)
- **Dynamic content** (patient-specific findings, session notes, recommendations → becomes placeholders)
- **Writing style** (formal vs conversational, terse vs detailed, passive vs active, hedging language patterns)
- **Recurring phrases** the doctor uses habitually

Output: a template schema + doctor profile JSON.

```json
{
  "template_schema": {
    "sections": [
      {
        "name": "patient_demographics",
        "type": "static_table",
        "fields": ["patient_name", "dob", "date_of_session", "referral_source"]
      },
      {
        "name": "presenting_complaint",
        "type": "dynamic_paragraph"
      },
      {
        "name": "clinical_observations",
        "type": "dynamic_bullets"
      },
      {
        "name": "diagnosis",
        "type": "dynamic_paragraph"
      },
      {
        "name": "recommendations",
        "type": "dynamic_bullets"
      },
      {
        "name": "standard_disclaimer",
        "type": "boilerplate"
      }
    ]
  },
  "doctor_profile": { "..." }
}
```

### Step 3: Template Construction

Pick the best-formatted uploaded DOCX as the base. Then programmatically:

1. Keep all document-level formatting (margins, borders, headers/footers, page size)
2. Keep boilerplate content in place
3. Replace dynamic content with Jinja2 placeholders while preserving paragraph/run styles

This is where each identified section from Step 2 gets matched to its location in the source document and swapped with `{{ presenting_complaint }}`, `{%p for item in recommendations %}`, etc.

**This is the hardest engineering step** — programmatically turning a real document into a Jinja2 template while preserving formatting. Most of the careful `python-docx` work lives here.

### Step 4: Doctor Review

Non-negotiable for production. Show the doctor their generated template rendered with dummy data so they can see what it'll look like. Let them adjust in Word and re-upload, or tweak via the app. Store the approved version.

---

## Pipeline 2 — Report Generation

### Step 1: Audio Input

Two modes:
- **Live recording** — chunked upload/streaming so data isn't lost on network drops
- **File upload** — accept common formats (MP3, WAV, M4A, etc.)

Normalize to a single audio file. **Store the raw audio immediately** before any processing.

### Step 2: Transcription

Use a medical-grade speech-to-text service with:
- **Medical vocabulary** support (drug names, conditions, anatomical terms)
- **Speaker diarization** (separating doctor vs patient) — critical for knowing who said what
- **Punctuation and formatting**

Output: a timestamped, speaker-labeled transcript.

### Step 3: Transcript Enrichment

Before report generation, run a lightweight extraction pass on the transcript to pull out structured clinical signals:

- Chief complaint
- Symptoms mentioned (with onset, severity, current status)
- Medications discussed
- Examination findings
- Assessment/plan items
- Key dates and timelines

This intermediate structured representation helps the report generator stay grounded in what was actually said rather than hallucinating clinical content — **which in a medical-legal context is a serious liability**.

### Step 4: Report Generation Agent

The core LLM call. Inputs:
- Doctor's template schema (the Pydantic model)
- Doctor profile (writing style, phrases, terminology)
- Enriched transcript
- Metadata (patient name, DOB, session date, location, referring provider)

**Prompt architecture:**
- **System prompt:** "You are generating a medical-legal report in the style of Dr. X" with the full doctor profile embedded
- **User prompt:** provides the transcript and metadata, asks for output as JSON matching the exact Pydantic schema

The AI outputs **structured JSON, not free text**. Every field maps to a template placeholder. This means you can validate the output with Pydantic before rendering — if a required section is missing or a field has the wrong type, you catch it before it hits the template.

### Step 5: DOCX Rendering

`docxtpl` takes the validated JSON + the doctor's template → final `.docx`. This step is purely mechanical, no AI involved.

### Step 6: Doctor Review & Approval

Show the rendered report in-app (convert to PDF for preview). Let the doctor:
- Edit in-app
- Download the DOCX, edit in Word, re-upload

**Track what they change** — this is the feedback signal.

### Step 7: Continuous Improvement (Background)

Store doctor edits as correction pairs (AI-generated vs doctor-approved). Periodically:
- Retune the doctor profile based on patterns in corrections
- If a doctor always rewrites the "Recommendations" section in a specific way, update their profile to reflect that
- Adjust prompt parameters and section-specific instructions

---

## Template System — `docxtpl` / Jinja2 in Word

The template is a real `.docx` file designed in Word. Jinja2 tags are typed directly into the document text.

### Simple Variables
```
Patient Name: {{ patient_name }}
Date of Birth: {{ patient_dob }}
```

### Bullet Lists
Each tag is its own paragraph in Word. The `{{ item }}` paragraph carries the bullet style.
```
{%p for item in recommendations %}
{{ item }}
{%p endfor %}
```
The `{%p %}` tag = paragraph-level (occupies its own paragraph, removed on render). When the loop runs N times, each rendered line inherits the bullet formatting.

### Table Rows
```
{%tr for row in examination_findings %}
{{ row.area }}    {{ row.finding }}    {{ row.notes }}
{%tr endfor %}
```

### Conditionals
```
{%p if seatbelt_worn %}
The claimant confirms they were wearing a seatbelt at the time of the incident.
{%p endif %}
```

### Why This Works
- The template IS the real `.docx` — every style, border, header/footer, page break survives
- AI never touches formatting — it only provides the content payload
- Supports conditionals, loops (for dynamic row counts), and inline images

---

## Python Libraries

### Document Processing
| Library | Purpose |
|---|---|
| `python-docx` | Read and parse `.docx` files, walk document tree, extract content and structure |
| `docxtpl` | Jinja2-based `.docx` template rendering — the report generator |
| `pymupdf` (fitz) | PDF text extraction for onboarding (when doctors upload PDFs) |
| `pdfplumber` | Alternative PDF extraction with better table handling |

### AI / LLM
| Library | Purpose |
|---|---|
| `anthropic` | Claude API client — Sonnet for extraction/filling, Opus for complex analysis (Template Architect) |

### Validation
| Library | Purpose |
|---|---|
| `pydantic` | Schema definition and validation gate between AI output and template rendering |

### Transcription
| Library | Purpose |
|---|---|
| `deepgram-sdk` | Medical-grade STT with speaker diarization, medical vocabulary, punctuation |
| `assemblyai` | Alternative: strong diarization, medical model available |

### Audio
| Library | Purpose |
|---|---|
| `pydub` | Audio format normalization (MP3/M4A/WAV conversion), chunking for upload |
| `sounddevice` | Live microphone recording (if in-app recording is supported) |

### Feedback & Diffing
| Library | Purpose |
|---|---|
| `deepdiff` | Compare AI-generated output vs doctor-approved edits to build correction pairs |

---

## Key Design Principles

1. **Structured output only** — AI is constrained to producing JSON that matches a Pydantic schema. It never writes free text into the document.

2. **Pydantic validation gate** — every AI output is validated before rendering. Missing fields, wrong types, or malformed data get caught before they hit the template.

3. **Doctor profile = stylistic DNA** — captures writing style, recurring phrases, and terminology so reports read like the doctor wrote them, not like generic AI output.

4. **Template stays .docx** — no format conversion ever. The template is authored in Word, stored as `.docx`, rendered by `docxtpl`. Formatting is never at risk.

5. **Feedback loop** — doctor edits are gold. Every correction pair (AI vs approved) improves the doctor profile and prompt over time.

6. **Transcript enrichment as guardrail** — the intermediate structured extraction step keeps the report generator grounded in what was actually said. In medical-legal work, hallucinated content is a serious liability.

7. **Doctor review is non-negotiable** — AI generates, doctor approves. Never auto-send or auto-file a report without human sign-off.
