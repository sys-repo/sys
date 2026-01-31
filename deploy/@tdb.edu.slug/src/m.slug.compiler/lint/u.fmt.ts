import { type t, c, Str } from './common.ts';
import { Fmt as Base } from '../u.fmt.ts';

const i = c.italic;
const g = c.gray;
const gi = (s: string) => g(i(s));

/** Lint-format utilities. */
export const Fmt = {
  ...Base,
  lintResults,
} as const;

/**
 * Renders a generic lint result into a CLI-friendly multi-line string.
 *
 * For each issue:
 *   [SEVERITY] kind
 *     doc: ...
 *     path: ...
 *     message: ...
 */
export function lintResults(issues: t.SlugLintIssue[]): string {
  if (issues.length === 0) return '';

  const b = Str.builder();

  issues.forEach((issue, index) => {
    const severity = issue.severity ?? 'error'; // 'error' | 'warning' | 'info'
    const kind = String(issue.kind);
    const path = issue.path ?? '';
    const message = issue.message ?? '';
    const severityLabel = formatSeverity(severity);

    const docid = issue.doc.id;
    const prettyId = `crdt:${docid.slice(0, -5)}${c.white(docid.slice(-5))}`;

    // First line: severity + kind.
    b.line(`${c.bold(severityLabel)} ${kind}`);

    if (docid) b.line(` ${c.cyan('doc:')} ${g(prettyId)}`);
    if (path) b.line(` ${c.cyan('path:')} ${gi(path)}`);
    if (message) b.line(` ${c.cyan('message:')} ${gi(message)}`);

    if (index < issues.length - 1) b.blank();
  });

  return b.toString();
}

function formatSeverity(sev: t.LintSeverity | undefined): string {
  const value = sev ?? 'error';
  const label = `[${value.toUpperCase()}]`;
  switch (value) {
    case 'warning':
      return c.yellow(label);
    case 'info':
      return c.cyan(label);
    case 'error':
    default:
      return c.red(label);
  }
}
