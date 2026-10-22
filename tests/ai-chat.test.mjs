import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ask, AskError } from '../src/components/AiChat/ask.ts';
import { parseAnswer, safeHref } from '../src/components/AiChat/answer.ts';

const registration = { id: 'cm-registration-dates', title: 'Kursanmeldung', url: 'https://example.com/anmeldung' };
const support = { id: 'cm-info-service', title: 'Info-Service', url: 'https://example.com/support' };
const reply = (run, init) => Response.json({ requestId: 'r1', runs: [run] }, init);
const okRun = { mapping: 'clef-flash', generation: 'ok', answer: 'Die Anmeldung erfolgt online.', insufficientEvidence: false, citations: [registration] };
async function failure(send) {
  try {
    await ask('Frage', send);
  } catch (error) {
    assert.ok(error instanceof AskError, `expected an AskError, got ${error}`);
    return error;
  }
  return assert.fail('ask() should have thrown');
}
const kindOf = async (send) => (await failure(send)).kind;

test('posts only the question to /api/chat and returns the answer with its sources', async () => {
  const calls = [];
  const result = await ask('Wie melde ich mich an?', async (url, init) => {
    calls.push({ url, init });
    return reply(okRun);
  });
  assert.deepEqual(result, { answer: 'Die Anmeldung erfolgt online.', sources: [registration] });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/chat');
  assert.equal(calls[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].init.body), { question: 'Wie melde ich mich an?' });
  assert.equal(calls[0].init.headers['content-type'], 'application/json');
  // A hanging backend must not spin forever.
  assert.ok(calls[0].init.signal instanceof AbortSignal);
  assert.equal(calls[0].init.signal.aborted, false);
});

test('keeps only well-formed citations', async () => {
  const result = await ask('Frage', async () => reply({
    ...okRun,
    citations: [registration, { id: 'x', title: 'no url' }, null, 'text', { id: 1, title: 'n', url: 'u' }, support],
  }));
  assert.deepEqual(result.sources, [registration, support]);
});

test('a skipped run (nothing relevant found) is a reply without an answer', async () => {
  const result = await ask('Frage', async () => reply({
    mapping: 'clef-flash', generation: 'skipped', answer: null, insufficientEvidence: true, citations: [], note: 'developer text',
  }));
  assert.deepEqual(result, { answer: null, sources: [] });
});

test('a blank answer counts as no answer', async () => {
  assert.equal((await ask('Frage', async () => reply({ ...okRun, answer: '  \n ' }))).answer, null);
});

test('maps HTTP errors to what the user needs to know, never to developer text', async () => {
  const body = { error: { code: 'x', message: 'neuron cap DAILY_NEURON_CAP reached', explanation: 'run npm run db:migrate' } };
  const status = async (code) => kindOf(async () => Response.json(body, { status: code }));
  assert.equal(await status(429), 'busy');
  assert.equal(await status(422), 'too-long');
  for (const code of [400, 404, 405, 500, 502, 503, 504]) assert.equal(await status(code), 'unavailable', String(code));
  const error = await failure(async () => Response.json(body, { status: 429 }));
  assert.equal(error.message, 'busy');
});

test('distinguishes an unreachable network from a timeout', async () => {
  assert.equal(await kindOf(async () => { throw new TypeError('fetch failed'); }), 'offline');
  assert.equal(await kindOf(async () => { throw new DOMException('signal timed out', 'TimeoutError'); }), 'timeout');
});

test('treats a malformed success response as the backend being unavailable', async () => {
  for (const response of [
    new Response('<html>not json</html>', { status: 200 }),
    Response.json(null),
    Response.json({}),
    Response.json({ runs: [] }),
    Response.json({ runs: [null] }),
    reply({ mapping: 'clef-flash', generation: 'error', answer: null, insufficientEvidence: false, citations: [], error: { code: 'provider-error' } }),
  ]) {
    assert.equal(await kindOf(async () => response), 'unavailable');
  }
});

test('turns [evidence-id] markers into numbered references in order of first citation', () => {
  const { segments, sources } = parseAnswer(
    'Anmeldung über Campus Management [cm-registration-dates]. Hilfe gibt es im Info-Service [cm-info-service], Fristen siehe [cm-registration-dates].',
    [support, registration],
  );
  assert.deepEqual(sources, [registration, support]);
  assert.deepEqual(segments, [
    { kind: 'text', text: 'Anmeldung über Campus Management ' },
    { kind: 'ref', number: 1, source: registration },
    { kind: 'text', text: '. Hilfe gibt es im Info-Service ' },
    { kind: 'ref', number: 2, source: support },
    { kind: 'text', text: ', Fristen siehe ' },
    { kind: 'ref', number: 1, source: registration },
    { kind: 'text', text: '.' },
  ]);
});

test('numbers sources that the text does not cite after the cited ones', () => {
  const other = { id: 'other', title: 'Weitere Quelle', url: 'https://example.com/other' };
  const { sources } = parseAnswer('Nur [cm-info-service].', [registration, other, support]);
  assert.deepEqual(sources, [support, registration, other]);
});

test('splits a combined marker [id-a, id-b] into two references', () => {
  const { segments } = parseAnswer('Siehe [cm-registration-dates, cm-info-service].', [registration, support]);
  assert.deepEqual(segments.map((s) => s.kind === 'ref' ? s.number : s.text), ['Siehe ', 1, 2, '.']);
});

test('leaves out markers for passages the backend did not hand over, closing the gap', () => {
  const parse = (text) => parseAnswer(text, [registration]).segments;
  assert.deepEqual(parse('Das gilt [unknown-id].'), [{ kind: 'text', text: 'Das gilt.' }]);
  assert.deepEqual(parse('Das [unknown-id] gilt.'), [{ kind: 'text', text: 'Das gilt.' }]);
  assert.deepEqual(parse('Erste Zeile [unknown-id]\nZweite Zeile'), [{ kind: 'text', text: 'Erste Zeile\nZweite Zeile' }]);
});

test('only lowercase kebab-case ids are markers; other brackets stay text', () => {
  const text = 'Siehe [Anlage 2] und [1] sowie [Hinweis].';
  assert.deepEqual(parseAnswer(text, [registration]).segments, [{ kind: 'text', text }]);
});

test('turns web addresses into links without swallowing sentence punctuation', () => {
  const link = (text) => parseAnswer(text, []).segments;
  assert.deepEqual(link('Mehr unter https://www.fu-berlin.de/studium. Danke'), [
    { kind: 'text', text: 'Mehr unter ' },
    { kind: 'link', href: 'https://www.fu-berlin.de/studium', text: 'https://www.fu-berlin.de/studium' },
    { kind: 'text', text: '. Danke' },
  ]);
  assert.deepEqual(link('(siehe https://example.org/a_(b))'), [
    { kind: 'text', text: '(siehe ' },
    { kind: 'link', href: 'https://example.org/a_(b)', text: 'https://example.org/a_(b)' },
    { kind: 'text', text: ')' },
  ]);
});

test('a web address right before a marker does not take the marker with it', () => {
  const { segments } = parseAnswer('Siehe https://example.com/anmeldung[cm-registration-dates]', [registration]);
  assert.deepEqual(segments.map((s) => s.kind), ['text', 'link', 'ref']);
});

test('only http(s) addresses in the text become links', () => {
  for (const text of ['javascript:alert(1)', 'data:text/html,<b>x</b>', 'ftp://example.com/file', 'http://', 'www.example.com']) {
    assert.deepEqual(parseAnswer(text, []).segments, [{ kind: 'text', text }], text);
  }
});

test('safeHref allows web and mail links and nothing else', () => {
  assert.equal(safeHref('https://example.com/a?b=c#d'), 'https://example.com/a?b=c#d');
  assert.equal(safeHref('http://example.com'), 'http://example.com/');
  assert.equal(safeHref('mailto:studienberatung@philosophie.fu-berlin.de'), 'mailto:studienberatung@philosophie.fu-berlin.de');
  for (const unsafe of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,x', 'file:///etc/passwd', '//example.com', '/relative', 'not a url', '']) {
    assert.equal(safeHref(unsafe), null, unsafe);
  }
});
