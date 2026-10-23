/** All visible text of the AI chat. The site is German, so the chat is too. */
import type { AskFailure } from './ask';

export const copy = {
  /** Tooltip next to the button and heading of the dialog. */
  name: 'KI-Chat',
  open: 'KI-Chat öffnen',
  close: 'Schließen',
  intro: 'Eine KI beantwortet deine Fragen zum Studium am Institut für Philosophie anhand ausgewählter Quellen. Sie kann sich irren: Prüfe Wichtiges über die verlinkten Quellen.',
  log: 'Chatverlauf',
  field: 'Deine Frage',
  placeholder: 'z. B. Wie melde ich mich für einen Kurs an?',
  send: 'Senden',
  youAsked: 'Deine Frage: ',
  reply: 'Antwort: ',
  searching: 'Antwort wird gesucht',
  nothingFound: 'Dazu habe ich in den Quellen nichts Passendes gefunden. Formuliere die Frage anders oder stöbere in den Kapiteln.',
  sources: 'Quellen',
  source: (number: number, title: string) => `Quelle ${number}: ${title}`,
  newTab: ' (öffnet in neuem Tab)',
  retry: 'Erneut versuchen',
  errors: {
    offline: 'Keine Verbindung. Prüfe dein Netz und versuche es erneut.',
    timeout: 'Die Antwort dauert zu lange. Versuche es gleich noch einmal.',
    busy: 'Gerade sind zu viele Fragen eingegangen. Bitte versuche es später noch einmal.',
    'too-long': 'Die Frage ist zu lang. Bitte formuliere sie kürzer.',
    unavailable: 'Der Chat ist gerade nicht erreichbar. Bitte versuche es später noch einmal.',
  } satisfies Record<AskFailure, string>,
};
