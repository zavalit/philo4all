/** The AI sparkle: a large and a small four-pointed star with rounded tips, in the current text colour. */
export function Sparkles({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path strokeWidth=".78" d="M10.39 5.61C12.15 10.57 13.43 11.85 18.39 13.61C13.43 15.37 12.15 16.65 10.39 21.61C8.63 16.65 7.35 15.37 2.39 13.61C7.35 11.85 8.63 10.57 10.39 5.61Z" />
      <path strokeWidth=".28" d="M17.79 2.09C18.75 4.66 19.32 5.23 21.89 6.19C19.32 7.15 18.75 7.72 17.79 10.29C16.83 7.72 16.26 7.15 13.69 6.19C16.26 5.23 16.83 4.66 17.79 2.09Z" />
    </svg>
  );
}
