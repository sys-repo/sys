import type { t } from './common.ts';


type CompositeIssueSeverity = 'error' | 'warning' | 'info';

type CompositeIssue = {
  readonly kind: string;
  readonly severity: CompositeIssueSeverity;
  readonly src?: string;
};

type CompositeResolvedWithIssues = {
  readonly issues?: readonly CompositeIssue[];
  readonly is?: { readonly valid?: boolean; readonly empty?: boolean };
};

function isResolvedWithIssues(input: unknown): input is CompositeResolvedWithIssues {
  if (!input || typeof input !== 'object') return false;
  const o = input as Record<string, unknown>;
  return 'issues' in o || 'is' in o;
}

/**
 * Generate issues from
 */
export function toIssueItems(resolved?: unknown): readonly t.KeyValueItem[] {
  if (!isResolvedWithIssues(resolved)) return [];

  const issues = resolved.issues ?? [];
  if (issues.length === 0) return [];

  const items: t.KeyValueItem[] = [];

  const counts = issues.reduce(
    (acc: { errors: number; warnings: number; info: number }, i: CompositeIssue) => {
      if (i.severity === 'error') acc.errors++;
      else if (i.severity === 'warning') acc.warnings++;
      else acc.info++;
      return acc;
    },
    { errors: 0, warnings: 0, info: 0 },
  );

  const mono = true;
  items.push({ kind: 'title', v: 'Issues', y: [35, 0] });

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
      // mono,
      // userSelect: 'text',
    });
  }

  if (issues.length > MAX) {
    items.push({ k: '…', v: `${issues.length - MAX} more`, mono: true });
  }

  return items;
}
