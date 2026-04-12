import { type t, Fmt as Base, c, Cli, Fs, Str, Time } from './common.ts';

export const Fmt = {
  ...Base,

  async help(cwd: t.StringDir) {
    const cmd = Base.invoke('pull');
    return await Base.help(cmd, {
      note: c.gray(`working dir: ${Fs.trimCwd(cwd)}`),
      usage: [
        `${cmd}`,
        `${cmd} --no-interactive --config ./my-config.yaml`,
      ],
      options: [
        ['-h, --help', 'show help'],
        ['--no-interactive', 'disable prompts and require direct inputs'],
        ['--config <path>', 'load a saved pull config YAML and pull all configured bundles'],
      ],
      examples: [
        `${cmd} --no-interactive --config ./my-config.yaml`,
      ],
    });
  },

  pullSummary(args: {
    bundle: t.PullTool.ConfigYaml.Bundle;
    data: {
      ops: readonly t.PullToolBundleResult['ops'][number][];
      dist?: t.DistPkg;
      summary?: {
        kind: 'http' | 'github:release';
        source?: t.StringUrl;
        repo?: string;
        release?: string;
      };
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
        [c.gray(' output'), outputLines.length > 0 ? outputLines.join('\n') : c.gray(c.dim('(none)'))],
      ]);
    } else {
      const source =
        summary?.source || (bundle.kind === 'http' ? bundle.dist : undefined);
      table.body([
        [c.gray(' source'), source ? formatSourceUrl(source) : c.gray(c.dim('(unknown)'))],
        [c.gray(' files'), c.white(String(dist ? Object.keys(dist.hash.parts).length : outputs.length))],
        [c.gray(' dist'), distValue],
        [c.gray(' bytes'), c.gray(Str.bytes(bytes))],
        [c.gray(' output'), outputLines.length > 0 ? outputLines.join('\n') : c.gray(c.dim('(none)'))],
      ]);
    }

    return String(Str.builder().blank().line(Str.trimEdgeNewlines(String(table))).blank());
  },
} as const;

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
