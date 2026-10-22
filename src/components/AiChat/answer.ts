/*
 * Turns the backend's answer text into something safe to render. The model cites passages with
 * [evidence-id] markers (or [id-a, id-b]); these become numbered references to the sources, and bare
 * URLs become links. Everything else stays plain text: the UI never injects HTML.
 */
import type { Source } from './ask';

export type Segment =
  | { kind: 'text'; text: string }
  | { kind: 'link'; href: string; text: string }
  | { kind: 'ref'; number: number; source: Source };

export interface ParsedAnswer {
  segments: Segment[];
  /** Numbered as shown: the cited sources in order of first citation, then the rest. */
  sources: Source[];
}

// The marker grammar of the backend (ax-chat worker/answer/citations.ts).
const ID = '[a-z][a-z0-9-]*';
const MARKER = new RegExp(`\\[(${ID}(?:\\s*,\\s*${ID})*)\\]`, 'g');
const URL_IN_TEXT = /https?:\/\/[^\s<>"]+/g;

/** Web pages and mail addresses only; anything else (javascript:, data:, …) is shown as plain text. */
export function safeHref(value: string): string | null {
  try {
    const url = new URL(value);
    return ['https:', 'http:', 'mailto:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function parseAnswer(text: string, sources: Source[]): ParsedAnswer {
  const byId = new Map(sources.map((source) => [source.id, source]));
  const numbered: Source[] = [];
  const segments: Segment[] = [];

  // split() with one capture group puts the bracket contents at the odd positions.
  text.split(MARKER).forEach((part, i) => {
    if (i % 2 === 0) {
      for (const segment of linkify(part)) push(segments, segment);
      return;
    }
    for (const id of part.split(',')) {
      const source = byId.get(id.trim());
      // A marker for a passage the backend did not hand over is left out rather than shown as an id.
      if (!source) continue;
      const number = numbered.includes(source) ? numbered.indexOf(source) + 1 : numbered.push(source);
      segments.push({ kind: 'ref', number, source });
    }
  });
  for (const source of sources) if (!numbered.includes(source)) numbered.push(source);
  return { segments, sources: numbered };
}

function* linkify(text: string): Generator<Segment> {
  let end = 0;
  for (const match of text.matchAll(URL_IN_TEXT)) {
    const url = withoutTrailingPunctuation(match[0]);
    const href = safeHref(url);
    if (!href) continue;
    if (match.index > end) yield { kind: 'text', text: text.slice(end, match.index) };
    yield { kind: 'link', href, text: url };
    end = match.index + url.length;
  }
  if (end < text.length) yield { kind: 'text', text: text.slice(end) };
}

// "…siehe https://example.org/seite." and "(https://example.org)" end the sentence, not the address.
function withoutTrailingPunctuation(url: string): string {
  let end = url.length;
  while (end > 0) {
    const last = url[end - 1];
    const head = url.slice(0, end);
    const unbalanced = last === ')' && head.split('(').length < head.split(')').length;
    if (!'.,;:!?'.includes(last) && !unbalanced) break;
    end--;
  }
  return url.slice(0, end);
}

// Text that ends up next to text was split by a dropped marker: close the gap it leaves.
function push(segments: Segment[], segment: Segment) {
  if (segment.kind === 'text' && !segment.text) return;
  const last = segments.at(-1);
  if (segment.kind !== 'text' || last?.kind !== 'text') {
    segments.push(segment);
    return;
  }
  const head = last.text.replace(/[ \t]+$/, '');
  const tail = segment.text.replace(/^[ \t]+/, '');
  const spaced = head !== last.text || tail !== segment.text;
  last.text = head + (spaced && head && tail && !head.endsWith('\n') && !/^[\n.,;:!?)]/.test(tail) ? ' ' : '') + tail;
}
