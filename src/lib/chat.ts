function error(status: number, code: string, message: string, headers?: HeadersInit) {
  return Response.json({ error: { code, message } }, { status, headers });
}

export async function handleChat(request: Request, env: Cloudflare.Env): Promise<Response> {
  if (request.method !== 'POST') {
    return error(405, 'method-not-allowed', 'Use POST.', { Allow: 'POST' });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error(400, 'invalid-request', 'Request body must be valid JSON.');
  }

  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      !('question' in body) || typeof body.question !== 'string') {
    return error(400, 'invalid-request', 'Provide a question string.');
  }
  const question = body.question.trim();
  if (!question || question.length > 2_000) {
    return error(400, 'invalid-request', 'Question must contain 1–2,000 characters.');
  }

  // Rebuild both headers and body: browser credentials, debug tokens, and mapping
  // overrides must never reach the backend.
  try {
    const backendRequest = new Request(env.AX_CHAT_URL || new URL('/api/ask', request.url), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question, mapping: 'clef-flash' }),
    });
    if (env.AX_CHAT_URL) return await fetch(backendRequest);
    if (!env.AX_CHAT) throw new Error('AX_CHAT binding is missing');
    return await env.AX_CHAT.fetch(backendRequest);
  } catch {
    return error(503, 'chat-unavailable', 'Chat is temporarily unavailable.');
  }
}
