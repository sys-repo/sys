import { c, Cli, Fmt as Base, Fs, Str, type t } from './common.ts';
import type { PullAddResult } from './u.add.ts';

export const Fmt = {
  ...Base,

  async help(cwd: t.StringDir) {
    const cmd = Base.invoke('pull');
    const config = './-config/@sys.tools.pull/components.yaml';
    return await Base.help(cmd, {
      note: c.gray(`working dir: ${formatWorkingDir(cwd)}`),
      sections: [
        {
          kind: 'lines',
          label: 'Usage',
          items: [
            `${cmd}`,
            `${cmd} add --config ${config} --manifest <url> --integrity <sha256> --store <path>`,
            `${cmd} --non-interactive --config ${config}`,
          ],
        },
        {
          kind: 'pairs',
          label: 'Commands',
          items: [
            ['add', 'add a checksum-pinned Dist bundle to a pull config'],
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
            'Pull owns checksum-pinned materialization and explicit mutable projection.',
            'Cell pulled-view setup uses Pull-owned config; the Cell descriptor remains unchanged.',
            `Pull config example: ${config}`,
          ],
        },
        {
          kind: 'lines',
          label: 'Workflow',
          items: [
            `${cmd} opens the interactive config menu.`,
            'Configure first, execute second.',
            `${cmd} add mutates durable pull config state; it does not pull files.`,
            '--non-interactive requires --config and pulls every bundle in that config.',
            'Non-interactive pull execution runs an existing config; it does not create one from flags.',
          ],
        },
        {
          kind: 'lines',
          label: 'Config YAML',
          items: [
            config,
            'dir: .',
            'bundles:',
            '  - kind: dist',
            '    manifest: https://example.com/ui.components/dist.json',
            '    integrity: sha256-<publisher-provided-manifest-hash>',
            '    store: ./.dist-store',
            '    project:',
            '      dir: ./view/components',
            '      mode: replace',
          ],
        },
        {
          kind: 'lines',
          label: 'Examples',
          items: [
            `${cmd} add --config ${config} --manifest https://example.com/ui.components/dist.json --integrity sha256-<publisher-provided-manifest-hash> --store ./.dist-store --project ./view/components --mode replace`,
            `${cmd} --non-interactive --config ${config}`,
          ],
        },
      ],
    });
  },

  async addHelp(cwd: t.StringDir) {
    const cmd = Base.invoke('pull add');
    const config = './-config/@sys.tools.pull/components.yaml';
    return await Base.help(cmd, {
      note: c.gray(`working dir: ${formatWorkingDir(cwd)}`),
      sections: [
        {
          kind: 'lines',
          label: 'Usage',
          items: [
            `${cmd} --config ${config} --manifest <url> --integrity <sha256> --store <path>`,
            `${cmd} --dry-run --config ${config} --manifest <url> --integrity <sha256> --store <path>`,
          ],
        },
        {
          kind: 'pairs',
          label: 'Options',
          items: [
            ['-h, --help', 'show add help'],
            ['--config <path>', 'pull config YAML to create or mutate'],
            ['--manifest <url>', 'absolute HTTP(S) dist.json URL'],
            ['--integrity <sha256>', 'publisher-provided exact manifest-byte SHA-256'],
            ['--store <path>', 'relative immutable generation store'],
            ['--project <path>', 'optional relative mutable projection target'],
            ['--mode <mode>', 'required create|replace authority with --project'],
            ['--dry-run', 'preview the config mutation without writing'],
          ],
        },
        {
          kind: 'lines',
          label: 'Semantics',
          items: [
            'Adds one checksum-pinned Dist bundle to durable config; it does not pull files.',
            'Manifest URL, publisher-provided integrity, and immutable store are required.',
            'Hashing the same download cannot establish artifact authority.',
            'Mutable projection is optional and requires an explicit create|replace mode.',
            'An exact existing bundle is a no-op success.',
            'Overlapping immutable and mutable filesystem authority is rejected.',
            'The resulting YAML is validated before writing.',
            `Next: ${Base.invoke('pull')} --non-interactive --config ${config}`,
          ],
        },
        {
          kind: 'lines',
          label: 'Examples',
          items: [
            `${cmd} --config ${config} --manifest https://example.com/ui.components/dist.json --integrity sha256-<publisher-provided-manifest-hash> --store ./.dist-store --project ./view/components --mode replace`,
          ],
        },
      ],
    });
  },

  addResult(result: PullAddResult) {
    const status = result.kind === 'exists'
      ? 'already configured'
      : result.kind === 'dry-run'
      ? 'would add bundle'
      : 'added bundle';
    const table = Cli.table();
    table.body([
      [c.gray(' status'), c.white(status)],
      [c.gray(' config'), c.cyan(Fs.trimCwd(result.yamlPath))],
      [c.gray(' manifest'), c.cyan(result.bundle.manifest)],
      [c.gray(' integrity'), c.white(result.bundle.integrity)],
      [c.gray(' store'), c.white(result.bundle.store)],
      [
        c.gray(' project'),
        result.bundle.project
          ? c.white(`${result.bundle.project.dir} (${result.bundle.project.mode})`)
          : c.gray(c.dim('(none)')),
      ],
      [c.gray(' created'), c.white(String(result.createdConfig))],
    ]);
    return String(Str.builder().blank().line(Str.trimEdgeNewlines(String(table))).blank())
      .trimEnd();
  },

  addError(error: string) {
    return c.yellow(error);
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
    data: t.PullTool.Bundle.Dist.Success | t.GithubPull.Success;
  }) {
    const { bundle, data } = args;
    const table = Cli.table();

    if (isDistSuccess(data)) {
      if (bundle.kind !== 'dist') throw new Error('Dist result does not match its bundle.');
      const generation = data.generation;
      const evidence = generation.verification;
      const projection = data.projection.kind === 'projected'
        ? `${data.projection.dir} (${data.projection.mode}, mutable)`
        : '(none)';
      table.body([
        [c.gray(' source'), formatSourceUrl(bundle.manifest)],
        [c.gray(' generation'), c.white(generation.kind)],
        [c.gray(' integrity'), c.white(generation.integrity)],
        [c.gray(' files'), c.white(String(evidence.assets.files))],
        [c.gray(' bytes'), c.gray(Str.bytes(evidence.assets.totalBytes))],
        [c.gray(' immutable'), c.cyan(generation.dir)],
        [
          c.gray(' projection'),
          data.projection.kind === 'projected' ? c.white(projection) : c.gray(c.dim(projection)),
        ],
      ]);
      return String(Str.builder().blank().line(Str.trimEdgeNewlines(String(table))).blank());
    }

    if (bundle.kind === 'dist') throw new Error('GitHub result does not match its bundle.');
    const outputs = data.files.map((file) => ({
      path: Fs.join(bundle.local.dir, file.target),
      size: Number(file.bytes),
    }));
    const bytes = outputs.reduce((acc, item) => acc + item.size, 0);
    const MAX_OUTPUT_ROWS = 20;
    const hasOverflow = outputs.length > MAX_OUTPUT_ROWS;
    const visible = hasOverflow ? outputs.slice(0, MAX_OUTPUT_ROWS - 1) : outputs;
    const overflowCount = outputs.length - visible.length;
    const maxPathLen = visible.reduce((acc, item) => Math.max(acc, item.path.length), 0);
    const items: Array<
      | { kind: 'asset'; path: string; size: number }
      | { kind: 'more'; count: number }
    > = visible.map((item) => ({ kind: 'asset', ...item }));
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

    const summary = data.resolved;
    if (summary.kind === 'github:release') {
      table.body([
        [c.gray(' repo'), c.cyan(summary.repo)],
        [c.gray(' release'), c.white(summary.tag)],
        [c.gray(' assets'), c.white(String(outputs.length))],
        [c.gray(' bytes'), c.gray(Str.bytes(bytes))],
        [
          c.gray(' output'),
          outputLines.length > 0 ? outputLines.join('\n') : c.gray(c.dim('(none)')),
        ],
      ]);
    } else {
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
    }

    return String(Str.builder().blank().line(Str.trimEdgeNewlines(String(table))).blank());
  },
} as const;

function isDistSuccess(
  data: t.PullTool.Bundle.Dist.Success | t.GithubPull.Success,
): data is t.PullTool.Bundle.Dist.Success {
  return 'generation' in data;
}

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
  return ['source', 'repo', 'ref', 'path', 'tag', 'asset'].includes(
    key.trim().toLowerCase(),
  );
}

function formatPullErrorMessage(lines: readonly string[]): string {
  return lines
    .flatMap(wrapPullErrorLine)
    .map((line) => `  ${formatPullErrorLine(line)}`)
    .join('\n');
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
  return c.yellow(c.italic(line));
}

function formatContextValue(key: string, value: string): string {
  const label = key.trim().toLowerCase();
  if (label === 'source' || label === 'repo') return c.cyan(value);
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

function formatSourceUrl(input: t.StringUrl): string {
  const url = Str.trimHttpScheme(input);
  const i = url.lastIndexOf('/');
  if (i < 0) return c.cyan(url);
  return c.cyan(url.slice(0, i) + c.dim(url.slice(i)));
}

function formatWorkingDir(cwd: t.StringDir): string {
  return Fs.trimCwd(cwd) || '.';
}
