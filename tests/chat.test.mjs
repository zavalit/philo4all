import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { handleChat } from '../src/lib/chat.ts';

const answer = {
  requestId: 'test-request',
  runs: [{
    mapping: 'clef-flash',
    generation: 'ok',
    answer: 'Die Anmeldung erfolgt in Campus Management.',
    citations: [{ id: 'cm-registration-dates', title: 'Kursanmeldung', url: 'https://example.com/source' }],
  }],
};

function request(body, headers = {}) {
  return new Request('https://philo4all.example/api/chat?debug=true', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

test('returns answers and citations through a fresh request with Clef ON', async () => {
  const incoming = request({
    question: '  Wie melde ich mich für einen Kurs an?  ',
    mapping: 'both',
    DEBUG_TOKEN: 'body-secret',
  }, {
    authorization: 'Bearer browser-secret',
    cookie: 'CF_Authorization=browser-session',
    'x-debug-token': 'header-secret',
  });
  const upstream = Response.json(answer, { headers: { 'x-request-id': 'backend-request' } });
  const response = await handleChat(incoming, {
    AX_CHAT: { async fetch(outgoing) {
      assert.notEqual(outgoing, incoming);
      assert.equal(outgoing.url, 'https://philo4all.example/api/ask');
      assert.equal(outgoing.method, 'POST');
      assert.deepEqual([...outgoing.headers], [['content-type', 'application/json']]);
      assert.deepEqual(await outgoing.json(), {
        question: 'Wie melde ich mich für einen Kurs an?',
        mapping: 'clef-flash',
      });
      return upstream;
    } },
  });
  assert.equal(response, upstream);
  assert.equal(response.headers.get('x-request-id'), 'backend-request');
  assert.deepEqual(await response.json(), answer);
});

for (const method of ['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS']) {
  test(`rejects ${method} with 405 and an Allow header`, async () => {
    const response = await handleChat(new Request('https://philo4all.example/api/chat', { method }), {});
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('allow'), 'POST');
  });
}

test('rejects malformed JSON before calling the backend', async () => {
  const response = await handleChat(request('{bad json'), {});
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'invalid-request');
});

test('rejects invalid questions before calling the backend', async () => {
  for (const body of [null, [], 42, {}, { question: null }, { question: 12 },
    { question: '' }, { question: ' \n\t ' }, { question: 'x'.repeat(2_001) }]) {
    const response = await handleChat(request(body), {});
    assert.equal(response.status, 400, JSON.stringify(body));
  }
});

test('accepts the backend limit of 2,000 characters', async () => {
  const response = await handleChat(request({ question: 'x'.repeat(2_000) }), {
    AX_CHAT: { fetch: async () => Response.json(answer) },
  });
  assert.equal(response.status, 200);
});

test('passes backend 429 status, JSON, and Retry-After through unchanged', async () => {
  const body = { error: { code: 'budget-exceeded', message: 'Daily cap reached.' } };
  const upstream = Response.json(body, { status: 429, headers: { 'retry-after': '60' } });
  const response = await handleChat(request({ question: 'Eine Frage' }), {
    AX_CHAT: { fetch: async () => upstream },
  });
  assert.equal(response, upstream);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('retry-after'), '60');
  assert.deepEqual(await response.json(), body);
});

test('preserves other HTTP errors returned by the backend', async () => {
  const upstream = Response.json({ error: { code: 'provider-unavailable' } }, { status: 502 });
  const response = await handleChat(request({ question: 'Eine Frage' }), {
    AX_CHAT: { fetch: async () => upstream },
  });
  assert.equal(response, upstream);
  assert.equal(response.status, 502);
});

test('returns 503 without exposing connection failure details', async () => {
  const response = await handleChat(request({ question: 'Eine Frage' }), {
    AX_CHAT: { fetch: async () => { throw new Error('sensitive internal failure'); } },
  });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    error: { code: 'chat-unavailable', message: 'Chat is temporarily unavailable.' },
  });
});

test('returns 503 if the deployment is missing its service binding', async () => {
  const response = await handleChat(request({ question: 'Eine Frage' }), {});
  assert.equal(response.status, 503);
});

test('a configured HTTP endpoint preserves answers, credentials privacy, 429, and connection errors', async (t) => {
  const calls = [];
  const backend = createServer(async (incoming, outgoing) => {
    const chunks = [];
    for await (const chunk of incoming) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString());
    calls.push({ url: incoming.url, method: incoming.method, headers: incoming.headers, body });
    outgoing.setHeader('Content-Type', 'application/json');
    if (body.question === 'limited') {
      outgoing.writeHead(429, { 'Retry-After': '60' });
      outgoing.end(JSON.stringify({ error: { code: 'budget-exceeded' } }));
    } else {
      outgoing.end(JSON.stringify(answer));
    }
  });
  await new Promise((resolve) => backend.listen(0, '127.0.0.1', resolve));
  t.after(() => backend.listening && new Promise((resolve) => backend.close(resolve)));
  const env = {
    AX_CHAT_URL: `http://127.0.0.1:${backend.address().port}/api/ask`,
    AX_CHAT: { fetch() { throw new Error('HTTP mode must not call the Worker binding'); } },
  };

  const response = await handleChat(request({ question: '  local question  ', mapping: 'both' }, {
    authorization: 'Bearer private', cookie: 'session=private', 'x-debug-token': 'private',
  }), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), answer);
  assert.equal(calls[0].url, '/api/ask');
  assert.equal(calls[0].method, 'POST');
  assert.deepEqual(calls[0].body, { question: 'local question', mapping: 'clef-flash' });
  for (const header of ['authorization', 'cookie', 'x-debug-token']) {
    assert.equal(calls[0].headers[header], undefined);
  }

  const limited = await handleChat(request({ question: 'limited' }), env);
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('retry-after'), '60');
  assert.deepEqual(await limited.json(), { error: { code: 'budget-exceeded' } });

  await new Promise((resolve) => backend.close(resolve));
  const unavailable = await handleChat(request({ question: 'backend stopped' }), env);
  assert.equal(unavailable.status, 503);
});
