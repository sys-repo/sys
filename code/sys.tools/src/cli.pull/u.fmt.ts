import { c, Cli, Fmt as Base, Fs, Str, type t, Time } from './common.ts';

export const Fmt = {
  ...Base,

  async help(cwd: t.StringDir) {
    const cmd = Base.invoke('pull');
    const config = './-config/@sys.tools.pull/components.yaml';
    return await Base.help(cmd, {
      note: c.gray(`working dir: ${Fs.trimCwd(cwd)}`),
      sections: [
        {
          kind: 'lines',
          label: 'Usage',
          items: [
            `${cmd}`,
            `${cmd} --non-interactive --config ${config}`,
          ],
        },
        {
          kind: 'pairs',
          label: 'Options',
          items: [
            ['-h, --help', 'show help'],
            ['--non-interactive', 'disable prompts and require direct inputs'],
            ['--config <path>', 'load a saved pull config YAML and pull all configured bundles'],
          ],
        },
        {
          kind: 'lines',
          label: 'Owner',
          items: [
            'Pull owns materialization: remote source → local target.',
            'Cell views reference the pull config path, not the dist URL or local directory.',
            `Cell example: views.components.source.pull = ${config}`,
          ],
        },
        {
          kind: 'lines',
          label: 'Workflow',
          items: [
            `${cmd} opens the interactive config menu.`,
            'Interactive mode can create/select a config and add an HTTP dist bundle.',
            '--non-interactive requires --config and pulls every bundle in that config.',
            'Non-interactive mode executes an existing config; it does not create one from flags.',
          ],
        },
        {
          kind: 'lines',
          label: 'Config YAML',
          items: [
            config,
            'dir: .',
            'bundles:',
            '  - kind: http',
            '    dist: https://fs.db.team/ui.components/dist.json',
            '    local:',
            '      dir: ./view/components',
          ],
        },
        {
          kind: 'lines',
          label: 'Examples',
          items: [
            `${cmd} --non-interactive --config ${config}`,
          ],
        },
      ],
    });
  },

  pullError(error: string) {
    const parsed = parsePullError(error);
    const b = Str.builder().line(formatPullErrorTitle()).blank();

    if (parsed.message.length > 0) {
      b.line(formatPullErrorMessage(parsed.message)).blank();
    }

    if (parsed.context.length > 0) {
      const table = Cli.table();
      table.body(
        parsed.context.map(([key, value]) => [c.gray(`  ${key}`), formatContextValue(key, value)]),
      );
      b.line(Str.trimEdgeNewlines(String(table))).blank();
    }

    if (parsed.detail.length > 0) {
      b.line(formatPullErrorMessage(parsed.detail)).blank();
    }

    b.line(formatPullErrorEnder());
    return String(b).trimEnd();
  },

  pullSummary(args: {
    bundle: t.PullTool.ConfigYaml.Bundle;
    data: {
      ops: readonly t.PullToolBundleResult['ops'][number][];
      dist?: t.DistPkg;
      summary?: t.PullToolBundleSummaryMeta;
    };
  }) {
    const { bundle, data } = args;
    const table = Cli.table();
    const outputs = data.ops.filter((m) => m.ok);
    const bytes = outputs.reduce((acc, m) => acc + Number(m.bytes ?? 0), 0);
    const dist = data.dist;
    const distHash = formatHashPrefix(dist?.hash?.digest);
    const built = formatBuiltAt(dist?.build?.time);
    const builtLabel = built ? `built ${built}${built === 'just now' ? '' : ' ago'}` : '';
    const distValue = builtLabel ? `${distHash}  ${c.gray(c.dim(builtLabel))}` : distHash;

    const rows = outputs.map((m) => {
      const path = Fs.trimCwd(m.path.target);
      const size = Number(m.bytes ?? 0);
      return { path, size };
    });

    const MAX_OUTPUT_ROWS = 20;
    const hasOverflow = rows.length > MAX_OUTPUT_ROWS;
    const visible = hasOverflow ? rows.slice(0, MAX_OUTPUT_ROWS - 1) : rows;
    const overflowCount = rows.length - visible.length;
    const maxPathLen = visible.reduce((acc, m) => Math.max(acc, m.path.length), 0);

    const items: Array<
      | { kind: 'asset'; path: string; size: number }
      | { kind: 'more'; count: number }
    > = visible.map((m) => ({ kind: 'asset', path: m.path, size: m.size }));
    if (hasOverflow) items.push({ kind: 'more', count: overflowCount });

    const outputLines = items.map((item, index, all) => {
      const branch = Base.Tree.branch([index, all]);
      if (item.kind === 'more') {
        return `${c.gray(c.dim(branch))} ${c.gray(c.italic(`...${item.count} more`))}`;
      }

      const parts = splitDirAndFile(item.path);
      const file = parts.file ? c.cyan(parts.file) : c.cyan(item.path);
      const pad = ' '.repeat(Math.max(1, maxPathLen - item.path.length + 1));
      const sizeLabel = c.dim(c.gray(`| ${Str.bytes(item.size)}`));
      return `${c.gray(c.dim(branch))} ${c.gray(parts.dir)}${file}${pad}${sizeLabel}`;
    });

    const summary = data.summary;
    if (summary?.kind === 'github:release') {
      const repo = summary.repo || (bundle.kind === 'github:release' ? bundle.repo : '');
      const release = summary.release ?? '';
      table.body([
        [c.gray(' repo'), c.cyan(repo)],
        [c.gray(' release'), c.white(release)],
        [c.gray(' assets'), c.white(String(outputs.length))],
        [c.gray(' dist'), distValue],
        [c.gray(' bytes'), c.gray(Str.bytes(bytes))],
        [
          c.gray(' output'),
          outputLines.length > 0 ? outputLines.join('\n') : c.gray(c.dim('(none)')),
        ],
      ]);
    } else if (summary?.kind === 'github:repo') {
      table.body([
        [c.gray(' repo'), c.cyan(summary.repo)],
        [c.gray(' ref'), c.white(summary.ref)],
        [c.gray(' path'), summary.path ? c.white(summary.path) : c.gray(c.dim('(root)'))],
        [c.gray(' files'), c.white(String(outputs.length))],
        [c.gray(' bytes'), c.gray(Str.bytes(bytes))],
        [
          c.gray(' output'),
          outputLines.length > 0 ? outputLines.join('\n') : c.gray(c.dim('(none)')),
        ],
      ]);
    } else {
      const source = summary?.source || (bundle.kind === 'http' ? bundle.dist : undefined);
      table.body([
        [c.gray(' source'), source ? formatSourceUrl(source) : c.gray(c.dim('(unknown)'))],
        [
          c.gray(' files'),
          c.white(String(dist ? Object.keys(dist.hash.parts).length : outputs.length)),
        ],
        [c.gray(' dist'), distValue],
        [c.gray(' bytes'), c.gray(Str.bytes(bytes))],
        [
          c.gray(' output'),
          outputLines.length > 0 ? outputLines.join('\n') : c.gray(c.dim('(none)')),
        ],
      ]);
    }

    return String(Str.builder().blank().line(Str.trimEdgeNewlines(String(table))).blank());
  },
} as const;

type PullErrorParts = {
  readonly message: readonly string[];
  readonly context: readonly (readonly [string, string])[];
  readonly detail: readonly string[];
};

function formatPullErrorTitle(): string {
  return c.black(c.bgYellow(c.bold(' Pull Failed ')));
}

function formatPullErrorEnder(): string {
  return c.yellow(Cli.Fmt.hr());
}

function parsePullError(error: string): PullErrorParts {
  const lines = String(error ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const message: string[] = [];
  const context: Array<readonly [string, string]> = [];
  const detail: string[] = [];
  let seenContext = false;

  for (const line of lines) {
    const contextMatch = line.match(/^([A-Za-z][A-Za-z0-9 _-]*):\s*(.+)$/);
    if (contextMatch && isPullErrorContextKey(contextMatch[1] ?? '')) {
      seenContext = true;
      context.push([contextMatch[1] ?? '', contextMatch[2] ?? '']);
      continue;
    }

    if (seenContext) detail.push(line);
    else message.push(line);
  }

  if (message.length === 0 && detail.length === 0) message.push('Bundle pull failed');
  return { message, context, detail };
}

function isPullErrorContextKey(key: string): boolean {
  return ['source', 'repo', 'ref', 'path', 'tag', 'asset', 'token admin'].includes(
    key.trim().toLowerCase(),
  );
}

function formatPullErrorMessage(lines: readonly string[]): string {
  return normalizePullErrorGuidance(lines)
    .flatMap(wrapPullErrorLine)
    .map((line) => `  ${formatPullErrorLine(line)}`)
    .join('\n');
}

function normalizePullErrorGuidance(lines: readonly string[]): readonly string[] {
  const privateRepo =
    'The repository may not exist, the ref/path may be wrong, or GitHub may be hiding a private repository.';
  const tokenRepo =
    'Set GH_TOKEN or GITHUB_TOKEN to a fine-grained PAT with this repository selected and grant Contents → Read-only.';
  if (lines.length === 2 && lines[0] === privateRepo && lines[1] === tokenRepo) {
    return [
      'The repository may not exist, the ref/path may be wrong, or GitHub may be hiding a private repository. Set GH_TOKEN or GITHUB_TOKEN to a fine-grained PAT with this repository selected and:',
      'Contents → Read-only',
    ];
  }
  return lines;
}

function wrapPullErrorLine(line: string): readonly string[] {
  return wrapWords(line, 76);
}

function wrapWords(input: string, width: number): readonly string[] {
  const words = String(input ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];

  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && next.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function formatPullErrorLine(line: string): string {
  const action = 'Contents → Read-only';
  if (line === action) return c.white(action);

  const index = line.indexOf(action);
  if (index < 0) return c.yellow(c.italic(line));

  const before = line.slice(0, index);
  const after = line.slice(index + action.length);
  return `${c.yellow(c.italic(before))}${c.white(action)}${c.yellow(c.italic(after))}`;
}

function formatContextValue(key: string, value: string): string {
  const label = key.trim().toLowerCase();
  if (label === 'source' || label === 'repo' || label === 'token admin') return c.cyan(value);
  return c.white(value);
}

function splitDirAndFile(path: string): { dir: string; file: string } {
  const a = path.lastIndexOf('/');
  const b = path.lastIndexOf('\\');
  const i = Math.max(a, b);
  if (i < 0) return { dir: '', file: path };
  return {
    dir: path.slice(0, i + 1),
    file: path.slice(i + 1),
  };
}

function formatHashPrefix(hash?: string): string {
  const suffix = String(hash ?? '')
    .trim()
    .slice(-5);
  if (!suffix) return `${c.gray(c.dim('#'))}${' '.repeat(5)}`;
  return Base.hashSuffix(suffix, 5);
}

function formatBuiltAt(input?: number): string {
  if (!Number.isFinite(input)) return '';
  const elapsed = Time.elapsed(input as number).msec;
  if (!Number.isFinite(elapsed) || elapsed < 0) return '';
  if (elapsed < 1000) return 'just now';
  return Time.Duration.create(elapsed).toString();
}

function formatSourceUrl(input: t.StringUrl): string {
  const url = Str.trimHttpScheme(input);
  const i = url.lastIndexOf('/');
  if (i < 0) return c.cyan(url);
  return c.cyan(url.slice(0, i) + c.dim(url.slice(i)));
}
