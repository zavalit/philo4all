/*
 * The AI chat island: a sparkle button under the page dots opens a modal dialog where visitors ask a
 * question and read the answer with its sources. Hydrated only with ?ai (src/directives/query.ts).
 * Each question is independent: the backend keeps no conversation, so only the question is sent.
 * The dialog is the native <dialog>: it traps focus, closes on Escape and makes the page inert.
 */
import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import styles from './AiChat.module.css';
import { parseAnswer, safeHref, type Segment } from './answer';
import { ask, AskError, type Reply } from './ask';
import { copy } from './copy';
import { Sparkles } from './Sparkles';

type Turn =
  | { question: string; state: 'pending' }
  | { question: string; state: 'done'; reply: Reply }
  | { question: string; state: 'failed'; message: string };

export default function AiChat() {
  // The server and the first client render are empty, so hydration always matches and nothing
  // shows before the island is running.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted ? <Chat /> : null;
}

function Chat() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const turnList = useRef<HTMLOListElement>(null);
  const pressedBackdrop = useRef(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState('');
  const [tip, setTip] = useState(false);
  const titleId = useId();
  const introId = useId();
  const fieldId = useId();
  const busy = turns.some((turn) => turn.state === 'pending');

  // Keep the newest exchange in view: its start when it is taller than the log, otherwise the bottom.
  function showLatest(behavior: ScrollBehavior) {
    const el = log.current;
    const last = turnList.current?.lastElementChild;
    if (!el || !(last instanceof HTMLElement)) return;
    el.scrollTo({ top: last.offsetHeight > el.clientHeight ? last.offsetTop : el.scrollHeight, behavior });
  }

  // A closed dialog has no layout to measure (an answer can arrive while it is closed); open() scrolls instead.
  useEffect(() => {
    if (dialog.current?.open) showLatest(matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth');
  }, [turns]);

  // Escape dismisses the tooltip without moving the pointer or the focus (WCAG 1.4.13).
  useEffect(() => {
    if (!tip) return;
    const dismiss = (event: KeyboardEvent) => event.key === 'Escape' && setTip(false);
    document.addEventListener('keydown', dismiss);
    return () => document.removeEventListener('keydown', dismiss);
  }, [tip]);

  function open() {
    setTip(false);
    dialog.current?.showModal();
    showLatest('instant');
    field.current?.focus();
  }

  async function fetchReply(index: number, question: string) {
    const settle = (turn: Turn) => setTurns((all) => all.map((current, i) => (i === index ? turn : current)));
    try {
      settle({ question, state: 'done', reply: await ask(question) });
    } catch (error) {
      settle({ question, state: 'failed', message: copy.errors[error instanceof AskError ? error.kind : 'unavailable'] });
    }
  }

  function submit() {
    const question = draft.trim();
    if (!question || busy) return;
    setDraft('');
    setTurns((all) => [...all, { question, state: 'pending' }]);
    void fetchReply(turns.length, question);
    field.current?.focus();
  }

  function retry(index: number) {
    if (busy) return;
    const { question } = turns[index];
    setTurns((all) => all.map((current, i) => (i === index ? { question, state: 'pending' } : current)));
    void fetchReply(index, question);
  }

  // Enter sends, Shift+Enter starts a new line; Enter that confirms an input-method composition does neither.
  function onFieldKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    submit();
  }

  return (
    <>
      <span
        className={styles.launcher}
        onPointerEnter={(event) => event.pointerType !== 'touch' && setTip(true)}
        onPointerLeave={() => setTip(false)}
      >
        <button
          ref={trigger}
          type="button"
          className={styles.trigger}
          aria-haspopup="dialog"
          onClick={open}
          onFocus={(event) => event.currentTarget.matches(':focus-visible') && setTip(true)}
          onBlur={() => setTip(false)}
        >
          <Sparkles className={styles.icon} />
          <span className="sr-only">{copy.open}</span>
        </button>
        <span className={styles.tip} data-open={tip ? '' : undefined} aria-hidden="true">{copy.name}</span>
      </span>

      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby={titleId}
        aria-describedby={introId}
        onClose={() => trigger.current?.focus()}
        // Only a press and release on the backdrop closes it, so selecting text can end outside without closing.
        onPointerDown={(event) => { pressedBackdrop.current = event.target === event.currentTarget; }}
        onClick={(event) => { if (pressedBackdrop.current && event.target === event.currentTarget) event.currentTarget.close(); }}
      >
        <div className={styles.panel}>
          <div className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              <Sparkles className={styles.titleIcon} />
              {copy.name}
            </h2>
            <button type="button" className={styles.close} onClick={() => dialog.current?.close()}>
              <svg className={styles.closeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
              <span className="sr-only">{copy.close}</span>
            </button>
          </div>
          <p id={introId} className={styles.intro}>{copy.intro}</p>

          {/* A focusable log: keyboard users scroll it, and new answers are announced as they arrive. */}
          <div ref={log} className={styles.log} role="log" tabIndex={0} aria-label={copy.log}>
            <ol ref={turnList} className={styles.turns}>
              {turns.map((turn, index) => (
                <li key={index} className={styles.turn}>
                  <p className={styles.question}><span className="sr-only">{copy.youAsked}</span>{turn.question}</p>
                  {turn.state === 'pending' && (
                    <p className={styles.pending}>
                      {copy.searching}
                      <span className={styles.dots} aria-hidden="true"><i /><i /><i /></span>
                    </p>
                  )}
                  {turn.state === 'done' && <Answer reply={turn.reply} />}
                  {turn.state === 'failed' && (
                    <div className={styles.error}>
                      <p>{turn.message}</p>
                      <button type="button" className={styles.retry} disabled={busy} onClick={() => retry(index)}>{copy.retry}</button>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>

          <form className={styles.composer} onSubmit={(event) => { event.preventDefault(); submit(); }}>
            <label className="sr-only" htmlFor={fieldId}>{copy.field}</label>
            <textarea
              ref={field}
              id={fieldId}
              className={styles.field}
              rows={2}
              maxLength={2000}
              placeholder={copy.placeholder}
              enterKeyHint="send"
              autoComplete="off"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onFieldKeyDown}
            />
            <button type="submit" className={styles.send} disabled={busy || !draft.trim()}>{copy.send}</button>
          </form>
        </div>
      </dialog>
    </>
  );
}

function Answer({ reply }: { reply: Reply }) {
  if (!reply.answer) return <p className={styles.answer}>{copy.nothingFound}</p>;
  const { segments, sources } = parseAnswer(reply.answer, reply.sources);
  return (
    <div className={styles.answer}>
      <p className={styles.text}>
        <span className="sr-only">{copy.reply}</span>
        {segments.map((segment, i) => <Piece key={i} segment={segment} />)}
      </p>
      {sources.length > 0 && (
        <div className={styles.sources}>
          <p className={styles.sourcesTitle}>{copy.sources}</p>
          <ol>
            {sources.map((source) => (
              <li key={source.id}><ExternalLink href={safeHref(source.url)}>{source.title}</ExternalLink></li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function Piece({ segment }: { segment: Segment }) {
  if (segment.kind === 'text') return segment.text;
  if (segment.kind === 'link') return <ExternalLink href={segment.href}>{segment.text}</ExternalLink>;
  const label = copy.source(segment.number, segment.source.title);
  return (
    <ExternalLink href={safeHref(segment.source.url)} className={styles.ref} label={label}>[{segment.number}]</ExternalLink>
  );
}

// Sources open in a new tab so the conversation, which lives only in this page, is not lost.
// A source without a usable address is shown as plain text.
function ExternalLink({ href, className, label, children }: { href: string | null; className?: string; label?: string; children: ReactNode }) {
  if (!href) return <span className={className}>{children}</span>;
  const mail = href.startsWith('mailto:');
  return (
    <a
      href={href}
      className={className}
      aria-label={label && label + (mail ? '' : copy.newTab)}
      {...(mail ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
    >
      {children}
      {!label && !mail && <span className="sr-only">{copy.newTab}</span>}
    </a>
  );
}
