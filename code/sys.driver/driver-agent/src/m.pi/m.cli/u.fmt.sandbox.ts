import { c, Cli, Fs, Str, type t } from './common.ts';
const DETAIL_PREVIEW_MAX = 3;
const PREVIEW_ITEM_MAX: [number, number] = [18, 10];

export const PiSandboxFmt = {
  table(input: t.PiCli.SandboxSummary) {
    const table = Cli.table([]);
    if (input.report) table.push([c.gray('report'), Cli.Fmt.Path.str(Fs.trimCwd(input.report))]);
    table.push([c.gray('context'), formatPreview([
      ...(input.context?.detail ?? []),
      ...(input.context?.include ?? []),
    ], input.cwd)]);
    table.push([c.gray('read'), formatPreview(cwdAndDetail(input.cwd, input.read?.detail ?? []))]);
    pushWriteRows(table, input.cwd, input.write);

    return Str.builder()
      .line(Cli.Fmt.hr(72, 'cyan'))
      .line(c.bold(c.cyan('Sandbox')))
      .line(Str.trimEdgeNewlines(String(table)))
      .toString();
  },
} as const;

function pushWriteRows(
  table: ReturnType<typeof Cli.table>,
  cwd: t.StringDir,
  input?: t.PiCli.SandboxSummary.Scope,
) {
  const summary = new Set(input?.summary ?? []);
  pushWriteBucket(table, 'write:cwd', [cwd], cwd);
  if (summary.has('temp')) {
    const temp = (input?.detail ?? []).filter((path) => isTempWritePath(path, cwd));
    pushWriteBucket(table, '     :tmp', temp, cwd);
  }
  const extra = (input?.detail ?? []).filter((path) => !isTempWritePath(path, cwd));
  if (summary.has('extra') || extra.length > 0) {
    pushWriteBucket(table, '   :extra', extra, cwd);
  }
}

function formatPreview(input: readonly t.StringPath[], cwd?: t.StringDir) {
  const items = summarizeDetail(input, cwd);
  if (items.length === 0) return c.dim('-');
  return items.join(c.gray(', '));
}

function summarizeDetail(input: readonly t.StringPath[], cwd?: t.StringDir) {
  const items = input.map((path) => formatPreviewPath(cwd ? previewPath(path, cwd) : prettyPath(path)));
  if (items.length <= DETAIL_PREVIEW_MAX) return items;
  return [...items.slice(0, DETAIL_PREVIEW_MAX), c.italic(c.cyan(`+${items.length - DETAIL_PREVIEW_MAX} more`))];
}

function cwdAndDetail(cwd: t.StringDir, input: readonly t.StringPath[]) {
  return [cwd, ...input];
}

function pushWriteBucket(
  table: ReturnType<typeof Cli.table>,
  label: string,
  input: readonly t.StringPath[],
  cwd: t.StringDir,
) {
  if (input.length === 0) return;
  const [head, ...tail] = input.map((path) => formatWritePath(path, cwd));
  table.push([c.yellow(label), head]);
  for (const item of tail) table.push(['', item]);
}

function prettyPath(path: t.StringPath) {
  const trimmed = Fs.trimCwd(path);
  return trimmed.length > 0 ? trimmed : path;
}

function formatWritePath(path: t.StringPath, cwd: t.StringDir) {
  return c.gray(Cli.Fmt.path(normalizeWritePath(path, cwd), (e) => {
    if (e.is.basename) e.change(c.yellow(e.part));
  }));
}

function trimPath(path: t.StringPath, cwd: t.StringDir) {
  if (path === cwd) return Fs.trimCwd(path);
  const prefix = `${cwd}/`;
  if (!path.startsWith(prefix)) return Fs.trimCwd(path);
  return `./${path.slice(prefix.length)}`;
}

function normalizeWritePath(path: t.StringPath, cwd: t.StringDir) {
  return withTrailingSlash(path === cwd ? prettyPath(path) : trimPath(path, cwd));
}

function withTrailingSlash(path: string) {
  return path.endsWith('/') ? path : `${path}/`;
}

function previewPath(path: t.StringPath, cwd: t.StringDir) {
  if (path === cwd) return prettyPath(path);
  return trimPath(path, cwd);
}

function formatPreviewPath(path: string) {
  const value = path.length > PREVIEW_ITEM_MAX[0] + PREVIEW_ITEM_MAX[1] + 2
    ? Str.ellipsize(path, PREVIEW_ITEM_MAX, '..')
    : path;
  return c.gray(value);
}

function isTempWritePath(path: t.StringPath, cwd: t.StringDir) {
  if (path === cwd) return false;
  const trimmed = prettyPath(path);
  if (trimmed.startsWith('/var/folders/')) return true;
  if (trimmed.startsWith('/tmp/')) return true;
  return false;
}
