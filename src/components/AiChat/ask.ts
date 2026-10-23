/*
 * Client side of POST /api/chat (src/lib/chat.ts): sends one question and returns the reply, or throws
 * an AskError saying what went wrong in the user's terms. Nothing here touches the DOM, so it also runs
 * under node:test. Backend errors carry developer text (budgets, migrations), which is never shown.
 */

/** A passage the answer is based on. */
export interface Source { id: string; title: string; url: string; }

export interface Reply {
  /** Text with [evidence-id] markers (see answer.ts); null when the backend found nothing to answer from. */
  answer: string | null;
  sources: Source[];
}

export type AskFailure = 'offline' | 'timeout' | 'busy' | 'too-long' | 'unavailable';

export class AskError extends Error {
  kind: AskFailure;
  constructor(kind: AskFailure) {
    super(kind);
    this.kind = kind;
  }
}

/** The first call to an idle model can be slow; beyond this the answer is not worth waiting for. */
export const TIMEOUT_MS = 60_000;

export async function ask(question: string, send: typeof fetch = fetch): Promise<Reply> {
  try {
    const response = await send('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new AskError(response.status === 429 ? 'busy' : response.status === 422 ? 'too-long' : 'unavailable');
    return toReply(await response.json());
  } catch (error) {
    throw error instanceof AskError ? error : new AskError(classify(error));
  }
}

function classify(error: unknown): AskFailure {
  const name = error instanceof Error ? error.name : '';
  if (name === 'TimeoutError') return 'timeout';
  // fetch rejects with a TypeError when the network cannot be reached.
  if (name === 'TypeError') return 'offline';
  // Anything else, such as a body that is not JSON, means the backend answered badly.
  return 'unavailable';
}

// A 200 carries one run per mapping; this client asks for exactly one (see handleChat).
function toReply(body: unknown): Reply {
  const runs = body && typeof body === 'object' && 'runs' in body && Array.isArray(body.runs) ? body.runs : [];
  const run = runs[0];
  if (!run || typeof run !== 'object' || run.generation === 'error') throw new AskError('unavailable');
  return {
    answer: typeof run.answer === 'string' && run.answer.trim() ? run.answer : null,
    sources: Array.isArray(run.citations) ? run.citations.filter(isSource) : [],
  };
}

function isSource(value: unknown): value is Source {
  return !!value && typeof value === 'object' && 'id' in value && 'title' in value && 'url' in value
    && typeof value.id === 'string' && typeof value.title === 'string' && typeof value.url === 'string';
}
