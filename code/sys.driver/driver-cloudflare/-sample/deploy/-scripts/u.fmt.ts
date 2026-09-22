import { Code } from '@sys/cli/fmt/code';
import { R2 } from '@sys/driver-cloudflare/r2';
import { c, Fmt, Str, type t, Text } from './common.ts';

/** Format the selected manifest pins and the next publication command. */
export function formatBuildSelection(
  selection: t.Selection,
  options: { width?: number } = {},
): string {
  const rows = (['public', 'private'] as const).map((audience) => ({
    label: `${audience}:`,
    checksum: selection[audience]['dist.json'],
  }));
  const labelWidth = Text.Width.max(rows.map((row) => row.label));
  const pins = rows.map(({ label, checksum }) =>
    `${Text.Width.padEnd(label, labelWidth)} ${c.gray(checksum)}`
  );
  const next = Str.dedent(`
    ${c.cyan('Next: publish public assets, then the private shell.')}
    ${Fmt.hr({ width: options.width, color: 'cyan' })}

    ${Code.block('deno task push', { indent: 2 })}
  `);
  return Str.builder()
    .line('Selected dist.selection.json')
    .lines(pins)
    .empty()
    .line(next)
    .toString();
}

/** Render copyable setup assignments from admitted names, never credential values or errors. */
export function formatMissingCredentials(
  task: t.CredentialTask,
  names: readonly string[],
  options: { width?: number } = {},
): string {
  const assignments = names.map((name) => `${c.cyan(name)}${c.magenta('=')}${c.yellow('"..."')}`)
    .join('\n');
  const body = Str.builder()
    .line('Missing or empty environment variables:')
    .empty()
    .line(Code.block(assignments, { indent: 4 }))
    .empty()
    .line(Str.dedent(`
      Set non-empty values in the repository-root ${c.cyan('.env')} or export them in your shell.
      Active ${c.cyan('.env')} entries override exported values.
    `))
    .toString();
  return formatFailure(task, {
    heading: `Cannot run ${task}: missing credentials.`,
    body,
    notes: [
      'See README.md for the bucket-scoped credentials required by this task.',
      'This task made no R2 requests.',
    ],
    next: 'After configuring credentials, rerun:',
  }, options);
}

/** Render only R2-owned diagnostic fields, never an upstream error message or stack. */
export function formatR2Failure(
  task: t.CredentialTask,
  detail: t.R2.Error.Diagnostic,
  options: { width?: number } = {},
): string {
  const advice = detail.status === 401 || detail.status === 403
    ? 'Check the S3 key pair, account, and bucket permissions.'
    : 'Check the R2 service and target configuration.';
  return formatFailure(task, {
    heading: `Cannot complete ${task}.`,
    body: Str.dedent(`
      ${R2.Error.format(detail)}

      ${advice}
    `),
    notes: [
      'No automatic retry or cleanup was performed.',
      'Earlier writes may remain.',
    ],
    next: 'After resolving the R2 failure, rerun:',
  }, options);
}

/** Shared failure layout; callers supply the admitted content and recovery instruction. */
function formatFailure(
  task: t.CredentialTask,
  content: {
    readonly heading: string;
    readonly body: string;
    readonly notes: readonly string[];
    readonly next: string;
  },
  options: { width?: number },
): string {
  const next = Str.dedent(`
    ${c.cyan(content.next)}
    ${Fmt.hr({ width: options.width, color: 'cyan' })}

    ${Code.block(`deno task ${task}`, { indent: 2 })}
  `);
  return Str.builder()
    .line(c.red(content.heading))
    .empty()
    .line(content.body)
    .empty()
    .lines(content.notes.map((note) => c.gray(c.italic(note))))
    .empty()
    .line(next)
    .toString();
}
