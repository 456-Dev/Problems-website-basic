// The three marks from the film's side rail: ? = question #1,
// the flip arrows = question #2 (asked back), the smiley = question #3.

type P = { className?: string };

export function Ask({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <text x="12" y="20.5" textAnchor="middle" fontSize="23" fontWeight="800"
            fontFamily="'Open Sans', Arial, sans-serif" fill="currentColor">?</text>
    </svg>
  );
}

export function Flip({ className }: P) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
         strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 11V9a3.5 3.5 0 0 1 3.5-3.5h11" />
      <path d="M15.5 2l3.5 3.5L15.5 9" />
      <path d="M19.5 13v2a3.5 3.5 0 0 1-3.5 3.5H5" />
      <path d="M8.5 22L5 18.5 8.5 15" />
    </svg>
  );
}

export function Happy({ className, sad }: P & { sad?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <g fill="none" stroke="#000" strokeWidth="1.9" strokeLinecap="round">
        {sad ? (
          <>
            <path d="M7 10h3M14 10h3" />
            <path d="M8 17.2q4-2.6 8 0" />
          </>
        ) : (
          <>
            <path d="M6.8 10.4q1.7-2 3.4 0M13.8 10.4q1.7-2 3.4 0" />
            <path d="M7.6 14.2q4.4 4.4 8.8 0" />
          </>
        )}
      </g>
    </svg>
  );
}
