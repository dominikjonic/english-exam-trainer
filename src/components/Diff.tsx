import { diffLetters } from '../lib/answer';

/**
 * Shows typed vs. correct answer. For a spelling slip (letters = true) extra
 * letters are struck through and missing ones highlighted; otherwise both
 * answers are shown as they are.
 */
export function Diff({ given, expected, letters = true }: { given: string; expected: string; letters?: boolean }) {
  if (!letters) {
    return (
      <div className="diff">
        <div>
          <span className="diff-label">Du:</span> <span className="diff-extra-plain">{given.trim() || '(nichts)'}</span>
        </div>
        <div>
          <span className="diff-label">Richtig:</span> <b>{expected}</b>
        </div>
      </div>
    );
  }
  const parts = diffLetters(given, expected);
  return (
    <div className="diff">
      <div>
        <span className="diff-label">Du:</span>{' '}
        {given.trim() ? (
          parts
            .filter((p) => p.kind !== 'missing')
            .map((p, i) => (
              <span key={i} className={p.kind === 'extra' ? 'diff-extra' : undefined}>
                {p.text}
              </span>
            ))
        ) : (
          <em>(nichts)</em>
        )}
      </div>
      <div>
        <span className="diff-label">Richtig:</span>{' '}
        {parts
          .filter((p) => p.kind !== 'extra')
          .map((p, i) => (
            <span key={i} className={p.kind === 'missing' ? 'diff-missing' : undefined}>
              {p.text}
            </span>
          ))}
      </div>
    </div>
  );
}
