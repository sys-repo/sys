import { c, Time, type t } from './common.ts';
import { DeployConfig } from '../u.deployConfig.ts';
import { DENO_CONSOLE_URL, formatPathTail, formatUrlParts, LINE, maxLabelWidth, richRow, row, toneColor } from './u.shared.ts';

type StagedEntrypointArgs = t.DenoDeploy.Pipeline.Prepared & {
  readonly elapsed?: t.Msecs;
};
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

  Deploy: {
    config(args: t.DenoDeploy.Fmt.DeployConfigArgs) {
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
              ...formatUrlParts(DENO_CONSOLE_URL),
              ...(config.org ? [c.white(`/${config.org}`)] : []),
            ],
          },
          ...(args.sourceDir ? [{ label: 'source dir', value: args.sourceDir, color: 'gray' as const }] : []),
          ...(args.stagedDir ? [{ label: 'staged dir', value: args.stagedDir, color: 'gray' as const }] : []),
        ],
      });
    },

    result(result: t.DenoDeploy.Fmt.DeployResult, title = 'Deploy Result', elapsed?: t.Msecs) {
      const revision = result.deploy?.url?.revision ?? '';
      const preview = result.deploy?.url?.preview ?? '';
      const highlight = wrangle.sharedDeployId(revision, preview);
      return InfoFmt.info({
        title,
        rows: [
          {
            label: 'ok',
            value: '',
            valueParts: wrangle.deployOkParts(result),
          },
          ...(elapsed !== undefined
            ? [{ label: 'elapsed', value: Time.duration(elapsed).format({ round: 1 }), color: 'gray' as const }]
            : []),
          { label: 'revision', value: '', valueParts: formatUrlParts(revision, { highlight }) },
          { label: 'preview', value: '', valueParts: formatUrlParts(preview, { highlight }) },
        ],
      });
    },

    failure(args: t.DenoDeploy.Fmt.DeployFailureArgs) {
      const details = wrangle.failureDetails(args.error);
      return InfoFmt.info({
        title: 'Deploy Failed',
        tone: 'warning',
        rows: [
          { label: 'phase', value: args.phase, color: 'white' },
          ...(args.at ? [{ label: 'at', value: args.at, color: 'gray' as const }] : []),
          { label: 'error', value: details.summary, color: 'red' },
          ...(details.traceId ? [{ label: 'trace id', value: details.traceId, color: 'yellow' as const }] : []),
          ...(details.revision ? [{ label: 'revision', value: details.revision, color: 'white' as const }] : []),
          ...(details.preview ? [{ label: 'preview', value: details.preview, color: 'cyan' as const }] : []),
          ...(details.stderr ? [{ label: 'stderr', value: details.stderr, color: 'gray' as const }] : []),
        ],
      });
    },
  },

  Staged: {
    entrypoint(args: StagedEntrypointArgs) {
      return InfoFmt.info({
        title: 'Staged Entrypoint',
        rows: [
          { label: 'dir', value: '', valueParts: formatPathTail(args.stagedDir) },
          { label: 'entry', value: wrangle.relativeTo(args.entrypoint, args.stagedDir), color: 'white' },
          { label: 'paths', value: wrangle.relativeTo(args.entryPaths, args.stagedDir), color: 'white' },
          { label: 'main', value: args.appEntrypoint, color: 'white' },
          { label: 'workspace', value: args.workspaceTarget, color: 'white' },
          { label: 'dist', value: args.distDir, color: 'white' },
          ...(args.distHash ? [{ label: 'dist:hash', value: '', valueParts: wrangle.hashSuffix(args.distHash) }] : []),
          ...(args.elapsed !== undefined
            ? [{ label: 'elapsed', value: Time.duration(args.elapsed).format({ round: 1 }), color: 'gray' as const }]
            : []),
        ],
      });
    },
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
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') return wrangle.objectErrorMessage(error);
  return String(error);
}

const wrangle = {
  failureDetails(error: unknown) {
    const message = failureMessage(error);
    const traceId = message.match(/trace id:\s*([a-f0-9]+)/i)?.[1];
    const urls = message.match(/https?:\/\/[^\s]+/g) ?? [];
    const revision = urls.find((url) => url.includes('console.deno.com/'));
    const preview = urls.find((url) => url.includes('.deno.net'));
    const stdout = wrangle.stdoutSummary(message);
    const stderr = wrangle.stderrSummary(message);
    return {
      summary: wrangle.failureSummary(message, stderr, stdout),
      traceId,
      revision,
      preview,
      stdout,
      stderr,
    } as const;
  },

  deployOkParts(result: t.DenoDeploy.Fmt.DeployResult) {
    const code = result.code === 0
      ? c.dim(c.gray(`code:${result.code}`))
      : `${c.gray('code:')}${c.red(String(result.code))}`;
    const parenColor = result.code === 0 ? wrangle.dimmedGray : c.gray;

    return [
      c.green(String(result.ok)),
      parenColor(' ('),
      code,
      parenColor(')'),
    ] as const;
  },

  dimmedGray(text: string) {
    return c.dim(c.gray(text));
  },

  failureSummary(message: string, stderr?: string, stdout?: string) {
    if (stderr) return stderr;
    if (stdout) return stdout;
    const lines = wrangle.contentLines(message);
    const preferred = lines.find((line) =>
      !line.startsWith('DenoDeploy.pipeline:') &&
      line !== 'stdout:' &&
      line !== 'stderr:' &&
      !line.startsWith('trace id:')
    );
    return preferred ?? lines[0] ?? message.trim();
  },

  stdoutSummary(message: string) {
    const stdout = message.split(/\nstdout:\n/i)[1]?.split(/\nstderr:\n/i)[0];
    if (!stdout) return undefined;

    const lines = wrangle.contentLines(stdout);
    const preferred = lines.find((line) =>
      !line.includes('Publishing ') &&
      !line.includes('Generating hashes') &&
      !line.includes('Loading previously uploaded files') &&
      !line.startsWith('Found ') &&
      !line.startsWith('You can view the revision here:')
    );

    return preferred;
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
      .map((line) => line.replace(/^[⠁-⣿]+\s*/, ''))
      .map((line) => line.replace(/^✗\s*/, ''));
  },

  sharedDeployId(revision: string, preview: string) {
    const revisionId = revision.match(/\/builds\/([A-Za-z0-9_-]+)/)?.[1];
    if (!revisionId) return [] as const;
    return preview.includes(revisionId) ? [revisionId] as const : [] as const;
  },

  relativeTo(path: string, base: string) {
    return path.startsWith(`${base}/`) ? `.${path.slice(base.length)}` : path;
  },

  hashSuffix(input: string) {
    if (input.length <= 5) return [c.brightGreen(input)] as const;
    return [c.dim(c.gray(input.slice(0, -5))), c.brightGreen(input.slice(-5))] as const;
  },

  objectErrorMessage(error: object) {
    const message = wrangle.pickString(error, ['message']);
    const stdout = wrangle.pickString(error, ['stdout']);
    const stderr = wrangle.pickString(error, ['stderr']);
    const code = wrangle.pickNumber(error, ['code']);

    if (message || stdout || stderr || code !== undefined) {
      return [
        ...(message ? [message] : []),
        ...(stdout ? [`stdout:\n${stdout}`] : []),
        ...(stderr ? [`stderr:\n${stderr}`] : []),
        ...(code !== undefined ? [`code: ${code}`] : []),
      ].join('\n\n');
    }

    return wrangle.stringifyObject(error);
  },

  pickString(value: object, keys: readonly string[]) {
    for (const key of keys) {
      const item = (value as Record<string, unknown>)[key];
      if (typeof item === 'string' && item.trim().length > 0) return item.trim();
    }
    return undefined;
  },

  pickNumber(value: object, keys: readonly string[]) {
    for (const key of keys) {
      const item = (value as Record<string, unknown>)[key];
      if (typeof item === 'number' && Number.isFinite(item)) return item;
    }
    return undefined;
  },

  stringifyObject(value: object) {
    const seen = new WeakSet<object>();
    const json = JSON.stringify(value, (_key, item) => {
      if (item instanceof Error) {
        return {
          name: item.name,
          message: item.message,
          stack: item.stack,
        };
      }

      if (item && typeof item === 'object') {
        if (seen.has(item)) return '[Circular]';
        seen.add(item);
      }

      return item;
    });

    return json ?? '[unserializable object]';
  },
} as const;
