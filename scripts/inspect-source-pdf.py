"""Read-only PDF/HTML inventory. Requires pypdf; see the accessibility report.

Usage: python scripts/inspect-source-pdf.py source.pdf dist/client/index.html
The output is evidence, not a PDF/UA or WCAG conformance verdict.
"""
import hashlib
import json
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

import pypdf
from pypdf import PdfReader

pdf_path, html_path = map(Path, sys.argv[1:])
reader = PdfReader(pdf_path)
root = reader.trailer['/Root']
roles = Counter()
figures = []
headings = []
language_overrides = Counter()
page_ids = {page.indirect_reference.idnum: i + 1 for i, page in enumerate(reader.pages)}


def walk(node, page=None):
    if hasattr(node, 'get_object'):
        node = node.get_object()
    if isinstance(node, list):
        for item in node:
            walk(item, page)
    elif isinstance(node, dict):
        if '/Pg' in node:
            page = page_ids.get(getattr(node.raw_get('/Pg'), 'idnum', None), page)
        if '/Lang' in node:
            language_overrides[str(node['/Lang'])] += 1
        role = str(node.get('/S', ''))
        if role:
            roles[role] += 1
        if role == '/Figure':
            figures.append({'page': page, 'alt': bool(node.get('/Alt')), 'actualText': bool(node.get('/ActualText'))})
        if role in ('/H1', '/H2', '/H3', '/H4', '/H5', '/H6'):
            headings.append({'role': role, 'title': str(node.get('/T', '')), 'page': page})
        if '/K' in node:
            walk(node['/K'], page)


walk(root.get('/StructTreeRoot'))

# Selected contrast evidence for this specific source PDF, not a general PDF validator.
# The sage panel was checked visually on rendered page 7; its vector fill is recorded below.
# Track PDF graphics-state save/restore and RGB/gray fills for the selected text runs.
fill = (0.0, 0.0, 0.0)
fill_stack = []
page7_fills = set()
sampled_text = []


def color_operator(operator, arguments, _cm, _tm):
    global fill
    if operator == b'q':
        fill_stack.append(fill)
    elif operator == b'Q' and fill_stack:
        fill = fill_stack.pop()
    elif operator == b'rg':
        fill = tuple(float(value) for value in arguments)
        page7_fills.add(fill)
    elif operator == b'g':
        fill = (float(arguments[0]),) * 3
    elif operator == b'k':
        fill = None  # CMYK requires a different calculation; do not guess an RGB value.


def sample_text(text, _cm, _tm, _font, _size):
    if text.strip() in ('WLAN & VPN', 'Drucken'):
        sampled_text.append({'text': text.strip(), 'foregroundRGB': fill})


reader.pages[6].extract_text(visitor_operand_before=color_operator, visitor_text=sample_text)
sage = (0.5647, 0.6745, 0.5569)
sample_matches = len(sampled_text) == 2 and sage in page7_fills


def luminance(color):
    linear = [value / 12.92 if value <= .04045 else ((value + .055) / 1.055) ** 2.4 for value in color]
    return sum(value * weight for value, weight in zip(linear, (.2126, .7152, .0722)))


if sample_matches:
    for sample in sampled_text:
        a, b = luminance(sample['foregroundRGB']), luminance(sage)
        sample['backgroundRGB'] = sage
        sample['contrast'] = (max(a, b) + .05) / (min(a, b) + .05)
uris = set()
link_actions = Counter()
for page in reader.pages:
    for ref in page.get('/Annots', []):
        annotation = ref.get_object()
        if annotation.get('/Subtype') != '/Link':
            continue
        action = annotation.get('/A', {})
        if '/URI' in action:
            uris.add(str(action['/URI']).strip())
            link_actions['URI'] += 1
        else:
            link_actions[str(action.get('/S', 'destination/other'))] += 1


class HTMLInventory(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = set()
        self.headings = Counter()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a' and urlsplit(attrs.get('href', '')).scheme in ('http', 'https', 'mailto'):
            self.links.add(attrs['href'])
        if tag in ('h1', 'h2', 'h3', 'h4', 'h5', 'h6'):
            self.headings[tag] += 1


html = HTMLInventory()
html.feed(html_path.read_text())
print(json.dumps({
    'sourceURL': 'https://www.geisteswissenschaften.fu-berlin.de/we01/studieren/studienberatung/philo4all/Kopie-von-Philo4all_aktuell_Juli_2025.pdf',
    'sha256': hashlib.sha256(pdf_path.read_bytes()).hexdigest(),
    'bytes': pdf_path.stat().st_size,
    'pypdfVersion': pypdf.__version__,
    'pages': len(reader.pages),
    'pageSizesPoints': sorted({(float(p.mediabox.width), float(p.mediabox.height)) for p in reader.pages}),
    'creator': reader.metadata.creator,
    'title': reader.metadata.title,
    'creationDate': reader.metadata.creation_date.isoformat() if reader.metadata.creation_date else None,
    'coverVersionLine': next((line.strip() for line in reader.pages[0].extract_text().splitlines() if 'Version' in line), None),
    'language': str(root.get('/Lang', '')),
    'structureLanguageOverrides': language_overrides,
    'marked': bool(root.get('/MarkInfo', {}).get('/Marked')),
    'structureTreePresent': '/StructTreeRoot' in root,
    'textCharactersPerPage': [len(p.extract_text()) for p in reader.pages],
    'structureRoleCounts': roles,
    'figures': {'count': len(figures), 'withAlt': sum(f['alt'] for f in figures), 'withActualText': sum(f['actualText'] for f in figures)},
    'figureCountsByPage': Counter(f['page'] for f in figures),
    'headingExamples': headings[:3] + [h for h in headings if h['title'] in ('5)  Technik', 'Software')],
    'selectedContrastSample': {
        'page': 7,
        'method': 'Selected text foreground from PDF graphics-state operators. Sage panel fill matched to the page-7 rendered panel; not a whole-document contrast audit.',
        'expectedSampleFound': sample_matches,
        'samples': sampled_text,
    },
    'linkAnnotationActions': link_actions,
    'htmlHeadingCounts': html.headings,
    'linkComparison': {
        'method': 'Exact unique URI strings; strips PDF whitespace only. Different URLs may reach the same resource. Not a content-parity verdict.',
        'pdfUniqueURIs': len(uris), 'htmlUniqueExternalLinks': len(html.links),
        'sharedExact': len(uris & html.links),
        'pdfOnly': sorted(uris - html.links),
        'htmlOnly': sorted(html.links - uris),
    },
}, ensure_ascii=False, indent=2))
