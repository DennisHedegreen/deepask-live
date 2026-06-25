#!/usr/bin/env python3
from __future__ import annotations

import html
import zipfile
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent
RENDERED = ROOT / "rendered-slides"
OUT = ROOT / "deepask-5min-slides.odp"
SLIDE_COUNT = 7


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def content_xml() -> str:
    pages = []
    for index in range(1, SLIDE_COUNT + 1):
        image = f"slide-{index:02d}.png"
        pages.append(
            f'''<draw:page draw:name="Slide {index}" draw:style-name="dp{index}" draw:master-page-name="Default">
  <draw:frame draw:name="Slide image {index}" draw:style-name="grImage" svg:x="0cm" svg:y="0cm" svg:width="28cm" svg:height="15.75cm">
    <draw:image xlink:href="Pictures/{esc(image)}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>
  </draw:frame>
</draw:page>'''
        )

    auto_styles = "\n".join(
        f'''<style:style style:name="dp{index}" style:family="drawing-page">
  <style:drawing-page-properties draw:fill="solid" draw:fill-color="#fbf8f1"/>
</style:style>'''
        for index in range(1, SLIDE_COUNT + 1)
    )

    return f'''<?xml version="1.0" encoding="UTF-8"?>
<office:document-content
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"
  xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  office:version="1.2">
  <office:automatic-styles>
    <style:style style:name="grImage" style:family="graphic">
      <style:graphic-properties draw:stroke="none" draw:fill="none"/>
    </style:style>
    {auto_styles}
  </office:automatic-styles>
  <office:body>
    <office:presentation>
      {"".join(pages)}
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
  <office:automatic-styles>
    <style:page-layout style:name="pm1">
      <style:page-layout-properties fo:page-width="28cm" fo:page-height="15.75cm" style:print-orientation="landscape"/>
    </style:page-layout>
  </office:automatic-styles>
  <office:master-styles>
    <style:master-page style:name="Default" style:page-layout-name="pm1"/>
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
    <meta:generator>Codex rendered DeepAsk ODP builder</meta:generator>
    <meta:creation-date>{now}</meta:creation-date>
    <meta:document-statistic meta:slide-count="{SLIDE_COUNT}"/>
  </office:meta>
</office:document-meta>
'''


def manifest_xml() -> str:
    entries = [
        '<manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.presentation"/>',
        '<manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>',
        '<manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>',
        '<manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>',
        '<manifest:file-entry manifest:full-path="settings.xml" manifest:media-type="text/xml"/>',
    ]
    for index in range(1, SLIDE_COUNT + 1):
        entries.append(
            f'<manifest:file-entry manifest:full-path="Pictures/slide-{index:02d}.png" manifest:media-type="image/png"/>'
        )
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest
  xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0"
  manifest:version="1.2">
  {"".join(entries)}
</manifest:manifest>
'''


def build() -> None:
    missing = [
        RENDERED / f"slide-{index:02d}.png"
        for index in range(1, SLIDE_COUNT + 1)
        if not (RENDERED / f"slide-{index:02d}.png").exists()
    ]
    if missing:
        raise SystemExit("Missing rendered slides: " + ", ".join(str(path) for path in missing))

    if OUT.exists():
        OUT.unlink()

    with zipfile.ZipFile(OUT, "w") as zf:
        zf.writestr("mimetype", "application/vnd.oasis.opendocument.presentation", compress_type=zipfile.ZIP_STORED)
        zf.writestr("content.xml", content_xml(), compress_type=zipfile.ZIP_DEFLATED)
        zf.writestr("styles.xml", styles_xml(), compress_type=zipfile.ZIP_DEFLATED)
        zf.writestr("meta.xml", meta_xml(), compress_type=zipfile.ZIP_DEFLATED)
        zf.writestr("settings.xml", '<?xml version="1.0" encoding="UTF-8"?><office:document-settings xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" office:version="1.2"><office:settings/></office:document-settings>', compress_type=zipfile.ZIP_DEFLATED)
        zf.writestr("META-INF/manifest.xml", manifest_xml(), compress_type=zipfile.ZIP_DEFLATED)
        for index in range(1, SLIDE_COUNT + 1):
            zf.write(RENDERED / f"slide-{index:02d}.png", f"Pictures/slide-{index:02d}.png", compress_type=zipfile.ZIP_DEFLATED)

    print(OUT)


if __name__ == "__main__":
    build()
