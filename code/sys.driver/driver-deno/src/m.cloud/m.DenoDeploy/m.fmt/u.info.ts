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
    readonly color?: 'white' | 'cyan' | 'gray' | 'green' | 'red' | 'yellow';
  }[];
  readonly tone?: 'warning' | 'success';
};

type DeployConfigArgs = {
  readonly app: string;
  readonly org?: string;
  readonly token?: string;
  readonly sourceDir?: string;
  readonly stagedDir?: string;
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
      c.bold(accent(args.title)),
      c.bold(accent(LINE)),
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
      c.bold(accent(LINE)),
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
      c.bold(accent(args.title)),
      c.bold(accent(LINE)),
      ...args.rows.map((rowData) =>
        rowData.valueParts
          ? richRow(rowData.label, rowData.valueParts, width)
          : row(rowData.label, rowData.value, { color: rowData.color ?? 'white', width }),
      ),
      c.bold(accent(LINE)),
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
        {
          label: 'Platform',
          value: '',
          valueParts: [
            c.dim(c.gray('https://')),
            c.cyan('console.deno.com'),
            ...(config.org ? [c.dim(c.gray(`/${config.org}`))] : []),
          ],
        },
        ...(args.sourceDir ? [{ label: 'source dir', value: args.sourceDir, color: 'gray' as const }] : []),
        ...(args.stagedDir ? [{ label: 'staged dir', value: args.stagedDir, color: 'gray' as const }] : []),
      ],
    });
  },

  stagedEntrypoint(args: StagedEntrypointArgs) {
    return InfoFmt.info({
      title: 'Staged Entrypoint',
      rows: [
        { label: 'source', value: args.sourceDir, color: 'white' },
        { label: 'staged dir', value: args.stagedDir, color: 'white' },
        { label: 'entry', value: args.entrypoint, color: 'white' },
        { label: 'paths', value: args.entryPaths, color: 'white' },
        { label: 'main', value: args.appEntrypoint, color: 'white' },
        { label: 'workspace', value: args.workspaceTarget, color: 'white' },
        { label: 'dist', value: args.distDir, color: 'white' },
        ...(args.distHash ? [{ label: 'dist:hash', value: args.distHash, color: 'gray' as const }] : []),
      ],
    });
  },

  deployResult(result: DeployResult, title = 'Deploy Result', elapsed?: t.Msecs) {
    const code = result.code === 0
      ? c.dim(c.gray(`code:${result.code}`))
      : `${c.gray('code:')}${c.red(String(result.code))}`;
    return InfoFmt.info({
      title,
      rows: [
        {
          label: 'ok',
          value: '',
          valueParts: [
            c.green(String(result.ok)),
            result.code === 0 ? c.dim(c.gray(' (')) : c.gray(' ('),
            code,
            result.code === 0 ? c.dim(c.gray(')')) : c.gray(')'),
          ],
        },
        ...(elapsed !== undefined
          ? [{ label: 'elapsed', value: Time.duration(elapsed).format({ round: 1 }), color: 'gray' as const }]
          : []),
        { label: 'revision', value: result.deploy?.url?.revision ?? '', color: 'white' },
        { label: 'preview', value: result.deploy?.url?.preview ?? '', color: 'cyan' },
      ],
    });
  },

  pipelineFailure(args: {
    readonly phase: string;
    readonly error: unknown;
  }) {
    const details = wrangle.failureDetails(args.error);
    return InfoFmt.info({
      title: 'Deploy Failed',
      tone: 'warning',
      rows: [
        { label: 'phase', value: args.phase, color: 'white' },
        { label: 'error', value: details.summary, color: 'red' },
        ...(details.traceId ? [{ label: 'trace id', value: details.traceId, color: 'yellow' as const }] : []),
        ...(details.revision ? [{ label: 'revision', value: details.revision, color: 'white' as const }] : []),
        ...(details.preview ? [{ label: 'preview', value: details.preview, color: 'cyan' as const }] : []),
        ...(details.stderr ? [{ label: 'stderr', value: details.stderr, color: 'gray' as const }] : []),
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
  if (!token) return [c.dim(c.gray('(default cli auth)'))] as const;

  const head = token.slice(0, 3);
  const tail = token.slice(-5);
  return [c.dim(c.gray(`${head}..${tail}`))] as const;
}

function failureMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

const wrangle = {
  failureDetails(error: unknown) {
    const message = failureMessage(error);
    const traceId = message.match(/trace id:\s*([a-f0-9]+)/i)?.[1];
    const urls = message.match(/https?:\/\/[^\s]+/g) ?? [];
    const revision = urls.find((url) => url.includes('console.deno.com/'));
    const preview = urls.find((url) => url.includes('.deno.net'));
    const stderr = wrangle.stderrSummary(message);
    return {
      summary: wrangle.failureSummary(message, stderr),
      traceId,
      revision,
      preview,
      stderr,
    } as const;
  },

  failureSummary(message: string, stderr?: string) {
    if (stderr) return stderr;
    const lines = wrangle.contentLines(message);
    const preferred = lines.find((line) =>
      !line.startsWith('DenoDeploy.pipeline:') &&
      line !== 'stdout:' &&
      line !== 'stderr:' &&
      !line.startsWith('trace id:')
    );
    return preferred ?? lines[0] ?? message.trim();
  },

  stderrSummary(message: string) {
    const stderr = message.split(/\nstderr:\n/i)[1];
    if (!stderr) return undefined;

    const lines = wrangle.contentLines(stderr);
    const preferred = lines.find((line) =>
      !line.startsWith('trace id:') &&
      !line.startsWith('[00:') &&
      !line.endsWith('files uploaded.') &&
      line !== 'An error occurred:'
    );

    return preferred ?? lines.find((line) => line !== 'An error occurred:');
  },

  contentLines(text: string) {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^✗\s*/, ''));
  },
} as const;
