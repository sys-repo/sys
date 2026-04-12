import { c, Cli, Fs, Str, type t } from './common.ts';

const DETAIL_WRAP_AT = 60;
const DETAIL_PREVIEW_MAX = 3;

export const PiSandboxFmt = {
  table(input: t.PiCli.SandboxSummary) {
    const table = Cli.table([]);
    if (input.report) table.push([c.gray('report'), Cli.Fmt.Path.str(Fs.trimCwd(input.report))]);
    table.push([c.gray('cwd'), formatCwdPath(input.cwd)]);
    pushWriteDetailRows(table, input.cwd, input.write);
    table.push([c.gray('write'), formatWriteSummary(input.write)]);
    table.push([c.gray('read'), formatSummary(input.read)]);
    table.push([c.gray('context'), formatContext(input.cwd, input.context)]);
    pushDetailRows(table, 'read+', input.cwd, input.read?.detail);
    pushDetailRows(table, 'context+', input.cwd, [
      ...(input.context?.detail ?? []),
      ...(input.context?.include ?? []),
    ]);

    return Str.builder()
      .line(Cli.Fmt.hr(72, 'green'))
      .line(c.bold(c.green('Sandbox:')))
      .line(Str.trimEdgeNewlines(String(table)))
      .line()
      .toString();
  },
} as const;

function formatSummary(input?: t.PiCli.SandboxSummary.Scope) {
  const items = input?.summary ?? [];
  if (items.length === 0) return c.dim('-');
  return items.map(formatScopeToken).join(c.gray(' + '));
}

function formatWriteSummary(input?: t.PiCli.SandboxSummary.Scope) {
  const items = input?.summary ?? [];
  if (items.length === 0) return c.dim('-');
  return items.map(formatWriteScopeToken).join(c.gray(' + '));
}

function formatContext(cwd: t.StringDir, input?: t.PiCli.SandboxSummary['context']) {
  const items: string[] = [];
  if (input?.agents === 'walk-up') items.push(c.white('AGENTS.md walk-up'));
  if ((input?.detail?.length ?? 0) > 0) items.push(c.white('discovered context'));
  if ((input?.include?.length ?? 0) > 0) items.push(c.white('extra context'));
  if (items.length === 0) return c.dim('-');
  return items.join(c.gray(', '));
}

function pushDetailRows(
  table: ReturnType<typeof Cli.table>,
  label: string,
  cwd: t.StringDir,
  input?: readonly t.StringPath[],
) {
  const items = summarizeDetail(cwd, input ?? []);
  if (items.length === 0) return;

  if (!shouldWrap(items)) {
    table.push([c.gray(label), items.join(c.gray(', '))]);
    return;
  }

  const [head, ...tail] = items;
  table.push([c.gray(label), head]);
  for (const item of tail) table.push(['', item]);
}

function pushWriteDetailRows(
  table: ReturnType<typeof Cli.table>,
  cwd: t.StringDir,
  input?: t.PiCli.SandboxSummary.Scope,
) {
  const summary = new Set(input?.summary ?? []);
  const label = summary.has('temp') && !summary.has('extra') ? 'tmp' : 'write+';
  const items = summarizeWriteDetail(cwd, input?.detail ?? []);
  if (items.length === 0) return;

  if (!shouldWrap(items)) {
    table.push([c.gray(label), items.join(c.gray(', '))]);
    return;
  }

  const [head, ...tail] = items;
  table.push([c.gray(label), head]);
  for (const item of tail) table.push(['', item]);
}

function summarizeDetail(cwd: t.StringDir, input: readonly t.StringPath[]) {
  const items = input.map((path) => Cli.Fmt.Path.str(trimPath(path, cwd)));
  if (items.length <= DETAIL_PREVIEW_MAX) return items;
  return [...items.slice(0, DETAIL_PREVIEW_MAX), c.italic(c.cyan(`+${items.length - DETAIL_PREVIEW_MAX} more`))];
}

function summarizeWriteDetail(cwd: t.StringDir, input: readonly t.StringPath[]) {
  const items = input.map((path) => formatWritePath(path, cwd));
  if (items.length <= DETAIL_PREVIEW_MAX) return items;
  return [...items.slice(0, DETAIL_PREVIEW_MAX), c.italic(c.cyan(`+${items.length - DETAIL_PREVIEW_MAX} more`))];
}

function prettyPath(path: t.StringPath) {
  const trimmed = Fs.trimCwd(path);
  return trimmed.length > 0 ? trimmed : path;
}

function formatCwdPath(cwd: t.StringDir) {
  return c.gray(Cli.Fmt.path(prettyPath(cwd), (e) => {
    if (e.is.basename) e.change(c.yellow(e.part));
  }));
}

function formatWritePath(path: t.StringPath, cwd: t.StringDir) {
  return c.gray(Cli.Fmt.path(path === cwd ? prettyPath(path) : trimPath(path, cwd), (e) => {
    if (e.is.basename) e.change(c.yellow(e.part));
  }));
}

function trimPath(path: t.StringPath, cwd: t.StringDir) {
  if (path === cwd) return Fs.trimCwd(path);
  const prefix = `${cwd}/`;
  if (!path.startsWith(prefix)) return Fs.trimCwd(path);
  return `./${path.slice(prefix.length)}`;
}

function visibleLength(input: string) {
  return input.replace(/\x1b\[[0-9;]*m/g, '').length;
}

function shouldWrap(items: readonly string[]) {
  return visibleLength(items.join(c.gray(', '))) > DETAIL_WRAP_AT;
}

function formatScopeToken(input: string) {
  switch (input) {
    case 'cwd':
      return c.white('cwd');
    case 'temp':
      return c.white('tmp');
    default:
      return c.white(input);
  }
}

function formatWriteScopeToken(input: string) {
  switch (input) {
    case 'cwd':
      return c.yellow('cwd');
    case 'temp':
      return c.yellow('tmp');
    default:
      return c.white(input);
  }
}
