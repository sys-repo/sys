import { type t, c, Cli, Fs, Str } from '../../common.ts';
import { Fmt } from '../../u.fmt.ts';

export function formatGithubReleaseSummary(args: {
  bundle: t.PullTool.ConfigYaml.GithubReleaseBundle;
  release: t.PullTool.GithubRelease;
  ops: readonly t.PullToolBundleResult['ops'][number][];
}): string {
  const { bundle, release, ops } = args;
  const table = Cli.table();
  const outputs = ops.filter((m) => m.ok);
  const bytes = outputs.reduce((acc, m) => acc + Number(m.bytes ?? 0), 0);
  const outputRows = outputs.map((m) => {
    const path = Fs.trimCwd(m.path.target);
    const size = Number(m.bytes ?? 0);
    return { path, size };
  });
  const maxPathLen = outputRows.reduce((acc, m) => Math.max(acc, m.path.length), 0);
  const outputLines = outputRows.map((m, index, all) => {
    const branch = Fmt.Tree.branch([index, all]);
    const parts = splitDirAndFile(m.path);
    const pad = ' '.repeat(Math.max(1, maxPathLen - m.path.length + 1));
    const sizeLabel = c.dim(c.gray(`| ${Str.bytes(m.size)}`));
    const file = parts.file ? c.cyan(parts.file) : c.cyan(m.path);
    return `${c.gray(c.dim(branch))} ${c.gray(parts.dir)}${file}${pad}${sizeLabel}`;
  });

  table.body([
    [c.gray(' release'), c.white(release.tag)],
    [c.gray(' repo'), c.cyan(bundle.repo)],
    [c.gray(' assets'), c.white(String(outputs.length))],
    [c.gray(' bytes'), c.gray(Str.bytes(bytes))],
    [
      c.gray(' output'),
      outputLines.length > 0 ? outputLines.join('\n') : c.gray(c.dim('(none)')),
    ],
  ]);

  return String(
    Str.builder()
      .blank()
      .line(Str.trimEdgeNewlines(String(table))),
  );
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
