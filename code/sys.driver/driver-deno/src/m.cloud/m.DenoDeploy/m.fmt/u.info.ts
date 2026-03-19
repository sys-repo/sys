import { c, Time, type t } from './common.ts';
import { DeployConfig } from '../u.deployConfig.ts';
import { LINE, maxLabelWidth, richRow, row, toneColor } from './u.shared.ts';

type StagedEntrypointArgs = t.DenoDeploy.Pipeline.Prepared;
type DeployResult = Extract<t.DenoDeploy.Deploy.Result, { readonly ok: true }>;

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
    readonly color?: 'white' | 'cyan' | 'gray' | 'green' | 'red';
  }[];
  readonly tone?: 'warning' | 'success';
};

type DeployConfigArgs = {
  readonly app: string;
  readonly org?: string;
  readonly token?: string;
  readonly staging?: string;
  readonly title?: string;
};

export const InfoFmt = {
  blocked(args: BlockedArgs) {
    const width = maxLabelWidth([
      'What',
      'Why',
      'Fix',
      ...(args.retry && args.retry.length > 0 ? ['Retry'] : []),
      ...(args.notes && args.notes.length > 0 ? ['Notes'] : []),
    ]);
    const accent = toneColor(args.tone ?? 'warning');
    return [
      '',
      ` ${c.bold(accent(args.title))}`,
      ` ${c.bold(accent(LINE))}`,
      richRow('What', [highlightSpecialTokens(args.what, 'white')], width),
      richRow('Why', [highlightSpecialTokens(args.why, 'white')], width),
      row('', '', { color: 'white', width }),
      richRow('Fix', [highlightEnvFile(args.fix[0] ?? '', 'white')], width),
      row('', '', { color: 'white', width }),
      ...args.fix.slice(1).map((line) => richRow('', [formatEnvAssignment(line)], width)),
      ...(args.retry && args.retry.length > 0
        ? [
            row('', '', { color: 'white', width }),
            row('Retry', args.retry[0] ?? '', { color: 'green', width }),
            ...args.retry.slice(1).map((line) => row('', line, { color: 'green', width })),
          ]
        : []),
      ...(args.notes && args.notes.length > 0
        ? [
            row('', '', { color: 'white', width }),
            row('Notes', args.notes[0] ?? '', { color: 'gray', width }),
            ...args.notes.slice(1).map((line) => row('', line, { color: 'gray', width })),
          ]
        : []),
      ` ${c.bold(accent(LINE))}`,
      '',
    ] as const;
  },

  envVarsNotFound(args: EnvVarsNotFoundArgs) {
    return InfoFmt.blocked({
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
    const width = maxLabelWidth(args.rows.map((row) => row.label));
    const accent = toneColor(args.tone ?? 'success');
    return [
      '',
      ` ${c.bold(accent(args.title))}`,
      ` ${c.bold(accent(LINE))}`,
      ...args.rows.map((rowData) =>
        rowData.valueParts
          ? richRow(rowData.label, rowData.valueParts, width)
          : row(rowData.label, rowData.value, { color: rowData.color ?? 'white', width }),
      ),
      ` ${c.bold(accent(LINE))}`,
      '',
    ] as const;
  },

  deployConfig(args: DeployConfigArgs) {
    const config = DeployConfig.normalize(args);
    return InfoFmt.info({
      title: args.title ?? 'Deploy Config',
      rows: [
        { label: 'App', value: config.app, color: 'white' },
        { label: 'Org', value: config.org ?? '(default cli context)', color: 'white' },
        { label: 'Token', value: '', valueParts: redactToken(config.token) },
        { label: 'Platform', value: 'https://console.deno.com', color: 'gray' },
        ...(args.staging ? [{ label: 'Staging', value: args.staging, color: 'gray' as const }] : []),
      ],
    });
  },

  stagedEntrypoint(args: StagedEntrypointArgs) {
    return InfoFmt.info({
      title: 'Staged Entrypoint',
      rows: [
        { label: 'staged dir', value: args.stagedDir, color: 'white' },
        { label: 'entry', value: args.entrypoint, color: 'white' },
        { label: 'entry paths', value: args.entryPaths, color: 'white' },
        { label: 'app config', value: args.appEntrypoint, color: 'white' },
        { label: 'workspace', value: args.workspaceTarget, color: 'white' },
        { label: 'dist', value: args.distDir, color: 'white' },
      ],
    });
  },

  deployResult(result: DeployResult, title = 'Deploy Result', elapsed?: t.Msecs) {
    return InfoFmt.info({
      title,
      rows: [
        { label: 'ok', value: String(result.ok), color: 'green' },
        { label: 'code', value: String(result.code), color: result.code === 0 ? 'green' : 'red' },
        { label: 'revision', value: result.deploy?.url?.revision ?? '', color: 'white' },
        { label: 'preview', value: result.deploy?.url?.preview ?? '', color: 'white' },
        ...(elapsed !== undefined
          ? [{ label: 'elapsed', value: Time.duration(elapsed).format({ round: 1 }), color: 'gray' as const }]
          : []),
      ],
    });
  },

  pipelineFailure(args: {
    readonly phase: string;
    readonly error: unknown;
  }) {
    return InfoFmt.info({
      title: 'Deploy Failed',
      tone: 'warning',
      rows: [
        { label: 'phase', value: args.phase, color: 'white' },
        { label: 'error', value: failureMessage(args.error), color: 'red' },
      ],
    });
  },
} as const;

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

function redactToken(token?: string) {
  if (!token) return [c.italic(c.gray('(default cli auth)'))] as const;

  const head = token.slice(0, 3);
  const tail = token.slice(-5);
  return [c.italic(c.gray(`${head}..${tail}`))] as const;
}

function failureMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
