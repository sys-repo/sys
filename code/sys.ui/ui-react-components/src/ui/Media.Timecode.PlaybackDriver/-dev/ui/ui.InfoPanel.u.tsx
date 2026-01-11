import { type t, Color } from '../common.ts';

/**
 * Extract and present composite-resolution issues for UI display.
 *
 * This is intentionally a presentation-only adapter:
 * - Pure function: resolved → KeyValueItem[].
 * - Payload-agnostic: diagnostics are independent of beat payload `P`.
 */
export function toIssueItems(resolved?: t.Timecode.Composite.Resolved): readonly t.KeyValueItem[] {
  if (!resolved) return [];

  const issues = resolved.issues ?? [];
  if (issues.length === 0) return [];

  const items: t.KeyValueItem[] = [];
  const counts = issues.reduce(
    (acc, i) => {
      if (i.severity === 'error') acc.errors++;
      else if (i.severity === 'warn') acc.warnings++;
      else acc.info++;
      return acc;
    },
    { errors: 0, warnings: 0, info: 0 },
  );

  const mono = true;
  items.push({
    kind: 'title',
    v: <span style={{ color: Color.YELLOW }}>{'Issues'}</span>,
    y: [35, 0],
  });

  const summary = [
    counts.errors ? `${counts.errors} error` : undefined,
    counts.warnings ? `${counts.warnings} warning` : undefined,
    counts.info ? `${counts.info} info` : undefined,
  ]
    .filter(Boolean)
    .join(', ');

  items.push({
    k: 'Summary',
    v: summary.length ? summary : '-',
    mono,
  });

  const valid = resolved.is?.valid;
  const empty = resolved.is?.empty;
  if (valid !== undefined) items.push({ k: 'Valid', v: valid ? 'yes' : 'no', mono });
  if (empty !== undefined) items.push({ k: 'Empty', v: empty ? 'yes' : 'no', mono });

  const MAX = 4;
  const top = issues.slice(0, MAX);
  for (const [i, issue] of top.entries()) {
    items.push({
      k: `${i + 1}. ${issue.severity}`,
      v: issue.src ? `${issue.kind}: ${issue.src}` : issue.kind,
      mono,
    });
  }

  if (issues.length > MAX) {
    items.push({ k: '…', v: `${issues.length - MAX} more`, mono });
  }

  return items;
}
