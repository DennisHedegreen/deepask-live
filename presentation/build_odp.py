#!/usr/bin/env python3
from __future__ import annotations

import html
import zipfile
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "deepask-5min-slides.odp"
SCREENSHOTS = ROOT / "screenshots"

SLIDES = [
    {
        "time": "0:00-0:30",
        "eyebrow": "DEEPASK LIVE",
        "title": "The survey that asks back",
        "body": "A civic listening tool disguised as an ice cream tasting.",
        "bullets": ["answer", "follow-up", "summary", "Mind Hive"],
        "image": None,
    },
    {
        "time": "0:30-1:10",
        "eyebrow": "THE PROBLEM",
        "title": "Most surveys taste flat",
        "body": "They collect ratings, boxes, and free text. Then the interesting meaning disappears into a spreadsheet.",
        "bullets": [
            "People answer in their own words.",
            "The system asks one neutral follow-up.",
            "The participant confirms the summary before it counts.",
        ],
        "image": "01-home.png",
    },
    {
        "time": "1:10-1:55",
        "eyebrow": "PARTICIPANT FLOW",
        "title": "One question, then one better question",
        "body": "The participant is not forced into a category first. They write naturally, and DeepAsk asks for the missing detail.",
        "bullets": [
            "No persuasion. No scoring. No judgement.",
            "The AI only clarifies meaning, barriers, needs, and suggestions.",
            "The ice cream theme keeps the demo light enough to understand fast.",
        ],
        "image": "02-survey.png",
    },
    {
        "time": "1:55-2:45",
        "eyebrow": "THE GOVERNANCE LAYER",
        "title": "Original voice stays separate",
        "body": "The important part is not just the UI. It is the workpack behind every answer.",
        "bullets": [
            "Raw participant text is stored separately from AI interpretation.",
            "The summary is shown back to the participant.",
            "The organiser can audit what happened without exposing raw answers publicly.",
        ],
        "image": "05-organizer-unlocked.png",
    },
    {
        "time": "2:45-3:40",
        "eyebrow": "MIND HIVE",
        "title": "From answers to group signals",
        "body": "DeepAsk does not publish individual result pages. It turns completed workpacks into collective patterns.",
        "bullets": [
            "Agreements, tensions, minority concerns, and next questions.",
            "People react to group statements, not to other people.",
            "The goal is not a final verdict. It is a better next conversation.",
        ],
        "image": "06-hackathon-mind-hive.png",
    },
    {
        "time": "3:40-4:35",
        "eyebrow": "OPERATOR SURFACE",
        "title": "A small tool, not a magic box",
        "body": "The organiser can create surveys, review summaries, export data, and inspect the researcher record.",
        "bullets": [
            "Survey builder for the question flow.",
            "Results and audit tabs for the operational record.",
            "JSON and CSV export when the data needs to leave the demo.",
        ],
        "image": "04-organizer.png",
    },
    {
        "time": "4:35-5:00",
        "eyebrow": "CLOSING",
        "title": "Better listening, one scoop deeper",
        "body": "DeepAsk helps people say what they mean, keeps the original voice separate, and gives organisers a clearer group signal.",
        "bullets": ["neutral AI", "confirmed summaries", "auditable data", "collective signal"],
        "image": None,
    },
]


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def text_frame(name: str, x: float, y: float, w: float, h: float, style: str, paragraphs: list[str]) -> str:
    ps = "\n".join(f'<text:p text:style-name="{style}">{esc(p)}</text:p>' for p in paragraphs)
    return (
        f'<draw:frame draw:name="{esc(name)}" draw:style-name="grNoLine" '
        f'svg:x="{x}cm" svg:y="{y}cm" svg:width="{w}cm" svg:height="{h}cm">\n'
        f"<draw:text-box>{ps}</draw:text-box>\n"
        "</draw:frame>"
    )


def image_frame(name: str, filename: str, x: float, y: float, w: float, h: float) -> str:
    href = f"Pictures/{filename}"
    return (
        f'<draw:frame draw:name="{esc(name)}" draw:style-name="grImage" '
        f'svg:x="{x}cm" svg:y="{y}cm" svg:width="{w}cm" svg:height="{h}cm">\n'
        f'<draw:image xlink:href="{esc(href)}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>\n'
        "</draw:frame>"
    )


def bullet_frames(slide: dict, x: float, y: float, w: float, compact: bool = False) -> list[str]:
    frames = []
    gap = 1.12 if not compact else 0.88
    height = 0.72 if not compact else 0.56
    for index, bullet in enumerate(slide["bullets"]):
        frames.append(text_frame(f"Bullet {index + 1}", x, y + index * gap, w, height, "PBody", [f"- {bullet}"]))
    return frames


def slide_xml(slide: dict, index: int) -> str:
    bg = "#fbf8f1" if index % 2 else "#f7fbf7"
    parts = [
        f'<draw:page draw:name="Slide {index}" draw:style-name="dp{index}" draw:master-page-name="Default">',
        text_frame("Time", 1.0, 0.75, 4.2, 0.6, "PTime", [slide["time"]]),
        text_frame("Eyebrow", 1.0, 1.62, 7.8, 0.55, "PEyebrow", [slide["eyebrow"]]),
    ]

    if slide["image"]:
        parts.extend(
            [
                text_frame("Title", 1.0, 2.45, 11.8, 3.05, "PTitle", [slide["title"]]),
                text_frame("Body", 1.0, 5.75, 11.5, 1.8, "PLead", [slide["body"]]),
                *bullet_frames(slide, 1.0, 8.1, 11.0),
                image_frame("Screenshot", slide["image"], 14.0, 2.0, 12.8, 9.2),
                text_frame("Caption", 14.0, 11.55, 12.8, 0.7, "PCaption", ["Screenshot from the running DeepAsk app."]),
            ]
        )
    else:
        parts.extend(
            [
                text_frame("Title", 2.0, 3.35, 24.0, 4.2, "PHuge", [slide["title"]]),
                text_frame("Body", 4.0, 8.05, 20.0, 1.4, "PCenterLead", [slide["body"]]),
                *bullet_frames(slide, 5.0, 10.25, 18.0, compact=True),
            ]
        )

    parts.append("</draw:page>")
    return "\n".join(parts)


def content_xml() -> str:
    auto_styles = "\n".join(
        f'<style:style style:name="dp{i}" style:family="drawing-page">'
        f'<style:drawing-page-properties draw:fill="solid" draw:fill-color="{"#fbf8f1" if i % 2 else "#f7fbf7"}"/>'
        "</style:style>"
        for i in range(1, len(SLIDES) + 1)
    )
    slides = "\n".join(slide_xml(slide, i) for i, slide in enumerate(SLIDES, start=1))
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<office:document-content
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"
  xmlns:presentation="urn:oasis:names:tc:opendocument:xmlns:presentation:1.0"
  xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  office:version="1.2">
  <office:automatic-styles>
    <style:style style:name="grNoLine" style:family="graphic">
      <style:graphic-properties draw:fill="none" draw:stroke="none"/>
    </style:style>
    <style:style style:name="grImage" style:family="graphic">
      <style:graphic-properties draw:stroke="solid" svg:stroke-color="#ded6c8" draw:fill="none"/>
    </style:style>
    <style:style style:name="PTime" style:family="paragraph">
      <style:text-properties fo:font-size="16pt" fo:font-weight="bold" fo:color="#235d72"/>
    </style:style>
    <style:style style:name="PEyebrow" style:family="paragraph">
      <style:text-properties fo:font-size="10pt" fo:font-weight="bold" fo:color="#235d72"/>
    </style:style>
    <style:style style:name="PTitle" style:family="paragraph">
      <style:text-properties fo:font-size="34pt" fo:font-weight="bold" fo:color="#20252d"/>
    </style:style>
    <style:style style:name="PHuge" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center"/>
      <style:text-properties fo:font-size="48pt" fo:font-weight="bold" fo:color="#20252d"/>
    </style:style>
    <style:style style:name="PLead" style:family="paragraph">
      <style:text-properties fo:font-size="16pt" fo:color="#657386"/>
    </style:style>
    <style:style style:name="PCenterLead" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center"/>
      <style:text-properties fo:font-size="17pt" fo:font-weight="bold" fo:color="#20252d"/>
    </style:style>
    <style:style style:name="PBody" style:family="paragraph">
      <style:text-properties fo:font-size="14pt" fo:color="#20252d"/>
    </style:style>
    <style:style style:name="PCaption" style:family="paragraph">
      <style:text-properties fo:font-size="10pt" fo:font-weight="bold" fo:color="#7b6140"/>
    </style:style>
    {auto_styles}
  </office:automatic-styles>
  <office:body>
    <office:presentation>
      {slides}
    </office:presentation>
  </office:body>
</office:document-content>
'''


def styles_xml() -> str:
    return '''<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  office:version="1.2">
  <office:styles>
    <style:style style:name="dpMaster" style:family="drawing-page">
      <style:drawing-page-properties draw:fill="solid" draw:fill-color="#fbf8f1"/>
    </style:style>
  </office:styles>
  <office:automatic-styles>
    <style:page-layout style:name="pm1">
      <style:page-layout-properties fo:page-width="28cm" fo:page-height="15.75cm" style:print-orientation="landscape"/>
    </style:page-layout>
  </office:automatic-styles>
  <office:master-styles>
    <style:master-page style:name="Default" style:page-layout-name="pm1" draw:style-name="dpMaster"/>
  </office:master-styles>
</office:document-styles>
'''


def meta_xml() -> str:
    now = datetime.now(timezone.utc).isoformat()
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<office:document-meta
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"
  office:version="1.2">
  <office:meta>
    <meta:generator>Codex DeepAsk ODP builder</meta:generator>
    <meta:creation-date>{now}</meta:creation-date>
    <meta:document-statistic meta:slide-count="{len(SLIDES)}"/>
  </office:meta>
</office:document-meta>
'''


def settings_xml() -> str:
    return '''<?xml version="1.0" encoding="UTF-8"?>
<office:document-settings
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  office:version="1.2">
  <office:settings/>
</office:document-settings>
'''


def manifest_xml(images: list[str]) -> str:
    entries = [
        '<manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.presentation"/>',
        '<manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>',
        '<manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>',
        '<manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>',
        '<manifest:file-entry manifest:full-path="settings.xml" manifest:media-type="text/xml"/>',
    ]
    for image in images:
        entries.append(
            f'<manifest:file-entry manifest:full-path="Pictures/{esc(image)}" manifest:media-type="image/png"/>'
        )
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest
  xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0"
  manifest:version="1.2">
  {"".join(entries)}
</manifest:manifest>
'''


def build() -> None:
    images = sorted({slide["image"] for slide in SLIDES if slide["image"]})
    missing = [image for image in images if not (SCREENSHOTS / image).exists()]
    if missing:
      raise SystemExit(f"Missing screenshots: {', '.join(missing)}")

    if OUT.exists():
        OUT.unlink()

    with zipfile.ZipFile(OUT, "w") as zf:
        zf.writestr("mimetype", "application/vnd.oasis.opendocument.presentation", compress_type=zipfile.ZIP_STORED)
        zf.writestr("content.xml", content_xml(), compress_type=zipfile.ZIP_DEFLATED)
        zf.writestr("styles.xml", styles_xml(), compress_type=zipfile.ZIP_DEFLATED)
        zf.writestr("meta.xml", meta_xml(), compress_type=zipfile.ZIP_DEFLATED)
        zf.writestr("settings.xml", settings_xml(), compress_type=zipfile.ZIP_DEFLATED)
        zf.writestr("META-INF/manifest.xml", manifest_xml(images), compress_type=zipfile.ZIP_DEFLATED)
        for image in images:
            zf.write(SCREENSHOTS / image, f"Pictures/{image}", compress_type=zipfile.ZIP_DEFLATED)

    print(OUT)


if __name__ == "__main__":
    build()
