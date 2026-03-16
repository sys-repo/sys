import { c } from './common.ts';

const LINE = '━'.repeat(84);

type BlockedArgs = {
  readonly title: string;
  readonly what: string;
  readonly why: string;
  readonly fix: readonly string[];
  readonly retry?: readonly string[];
  readonly notes?: readonly string[];
  readonly tone?: 'warning' | 'success';
};

type EnvVarsNotFoundArgs = {
  readonly title: string;
  readonly what: string;
  readonly why: string;
  readonly retry: string;
  readonly notes?: readonly string[];
};

type InfoArgs = {
  readonly title: string;
  readonly rows: readonly {
    readonly label: string;
    readonly value: string;
    readonly valueParts?: readonly string[];
    readonly color?: 'white' | 'cyan' | 'gray' | 'green';
  }[];
  readonly tone?: 'warning' | 'success';
};

export const Fmt = {
  blocked(args: BlockedArgs) {
    const accent = toneColor(args.tone ?? 'warning');
    return [
      '',
      `${indent()}${c.bold(accent(args.title))}`,
      `${indent()}${c.bold(accent(LINE))}`,
      richRow('What', [highlightSpecialTokens(args.what, 'white')]),
      richRow('Why', [highlightSpecialTokens(args.why, 'white')]),
      row('', '', { color: 'white' }),
      richRow('Fix', [highlightEnvFile(args.fix[0] ?? '', 'white')]),
      row('', '', { color: 'white' }),
      ...args.fix.slice(1).map((line) => richRow('', [formatEnvAssignment(line)])),
      ...(args.retry && args.retry.length > 0
        ? [row('', '', { color: 'white' }), row('Retry', args.retry[0] ?? '', { color: 'green' }), ...args.retry.slice(1).map((line) => row('', line, { color: 'green' }))]
        : []),
      ...(args.notes && args.notes.length > 0
        ? [row('', '', { color: 'white' }), row('Notes', args.notes[0] ?? '', { color: 'gray' }), ...args.notes.slice(1).map((line) => row('', line, { color: 'gray' }))]
        : []),
      `${indent()}${c.bold(accent(LINE))}`,
      '',
    ] as const;
  },

  envVarsNotFound(args: EnvVarsNotFoundArgs) {
    return Fmt.blocked({
      title: args.title,
      what: args.what,
      why: args.why,
      fix: [
        'Put in the .env file:',
        '  DENO_DEPLOY_ORG="..."',
        '  DENO_DEPLOY_TOKEN="..."',
        '  DENO_DEPLOY_APP="..."',
        '  DENO_DEPLOY_REGION=global',
      ],
      retry: [`  ${args.retry}`],
      notes: args.notes,
    });
  },

  info(args: InfoArgs) {
    const accent = toneColor(args.tone ?? 'success');
    return [
      '',
      `${indent()}${c.bold(accent(args.title))}`,
      `${indent()}${c.bold(accent(LINE))}`,
      ...args.rows.map((rowData) =>
        rowData.valueParts
          ? richRow(rowData.label, rowData.valueParts)
          : row(rowData.label, rowData.value, { color: rowData.color ?? 'white' })
      ),
      `${indent()}${c.bold(accent(LINE))}`,
      '',
    ] as const;
  },
} as const;

function row(label: string, value: string, options: { color?: 'white' | 'cyan' | 'gray' | 'green' } = {}) {
  const head = c.gray(normalizeLabel(label).padEnd(5));
  const text =
    options.color === 'green'
      ? c.green(value)
      : options.color === 'cyan'
      ? c.cyan(value)
      : options.color === 'gray'
        ? c.gray(value)
        : c.white(value);
  return `${indent()}${head} ${c.gray('│')} ${text}`;
}

function richRow(label: string, parts: readonly string[]) {
  const head = c.gray(normalizeLabel(label).padEnd(5));
  return `${indent()}${head} ${c.gray('│')} ${parts.join('')}`;
}

function highlightEnvFile(text: string, color: 'white' | 'cyan' | 'gray') {
  return highlightSpecialTokens(text, color, ['.env']);
}

function formatEnvAssignment(text: string) {
  const trimmed = text.trimStart();
  const indentText = text.slice(0, text.length - trimmed.length);
  const equals = trimmed.indexOf('=');
  if (equals === -1) return c.cyan(text);

  const key = trimmed.slice(0, equals + 1);
  const value = trimmed.slice(equals + 1);
  return `${c.cyan(indentText + key)}${formatEnvValue(value)}`;
}

function formatEnvValue(value: string) {
  if (value === '"..."') return `${c.white('"')}${c.gray('...')}${c.white('"')}`;
  if (value === '...') return c.gray(value);
  return c.cyan(value);
}

function highlightSpecialTokens(
  text: string,
  color: 'white' | 'cyan' | 'gray',
  tokens: readonly string[] = ['DENO_DEPLOY_APP', '.env'],
) {
  let parts: string[] = [text];
  for (const token of tokens) {
    parts = parts.flatMap((part) => splitAndHighlight(part, token, color));
  }
  return parts.join('');
}

function colorize(text: string, color: 'white' | 'cyan' | 'gray') {
  if (text.length === 0) return '';
  return color === 'cyan' ? c.cyan(text) : color === 'gray' ? c.gray(text) : c.white(text);
}

function splitAndHighlight(text: string, token: string, color: 'white' | 'cyan' | 'gray') {
  if (text.length === 0 || !text.includes(token)) return [colorize(text, color)];
  const chunks = text.split(token);
  return chunks.flatMap((chunk, index) => {
    const out = [colorize(chunk, color)];
    if (index < chunks.length - 1) out.push(c.cyan(token));
    return out;
  });
}

function indent() {
  return ' ';
}

function toneColor(tone: 'warning' | 'success') {
  return tone === 'warning' ? c.yellow : c.green;
}

function normalizeLabel(label: string) {
  return label.length === 0 ? label : label.toLowerCase();
}
