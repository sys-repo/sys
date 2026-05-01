import { c, Cli, Fs, Is, Num, Path, Str, type t } from './common.ts';

type PiSandboxTableOptions = {
  readonly width?: number;
};

type PreviewFit = {
  readonly visible: readonly string[];
  readonly hidden: number;
};

const SANDBOX_EDGE_MARGIN = 1;
const SANDBOX_TABLE_LABEL_WIDTH = 'permissions'.length;
const SANDBOX_TABLE_GAP = 3;
const SANDBOX_TABLE_MARGIN = SANDBOX_TABLE_LABEL_WIDTH + SANDBOX_TABLE_GAP;
const PREVIEW_ELLIPSIS = '..';
const PREVIEW_PROFILES: readonly (readonly [number, number])[] = [
  [10, 18],
  [6, 14],
  [3, 10],
];
const PATH_DIR_PREFIX_WIDTH = 4;
const WRITE_CWD_MARKER = ' (git)';
const TOOL_OPS = 'read, write, edit, bash';

export const PiSandboxFmt = {
  table(input: t.PiCli.SandboxSummary, opts: PiSandboxTableOptions = {}) {
    const renderWidth = sandboxRenderWidth(opts.width);
    const contentBudget = sandboxContentBudget(renderWidth);
    const table = Cli.table([]);

    if (input.report) {
      table.push([c.gray('report'), formatReportPath(input.report, contentBudget, input.cwd.git)]);
    }
    table.push([c.gray('permissions'), formatPermissions(input.permissions)]);
    table.push([
      c.gray('context'),
      formatPreview(input.context?.include ?? [], contentBudget, input.cwd.git),
    ]);
    table.push([
      c.gray('read'),
      input.permissions === 'allow-all'
        ? c.yellow('all')
        : formatPreview(cwdAndDetail(input.cwd.git, input.read?.detail ?? []), contentBudget),
    ]);
    if (input.permissions === 'allow-all') table.push([c.yellow('write'), c.yellow('all')]);
    else pushWriteRows(table, input.cwd.git, input.write, contentBudget);

    const frameColor = input.permissions === 'allow-all' ? 'yellow' : 'cyan';
    const title = formatTitle(input.permissions, renderWidth);

    return Str.builder()
      .line(title)
      .line(Cli.Fmt.hr(renderWidth, frameColor))
      .line(Str.trimEdgeNewlines(String(table)))
      .line(Cli.Fmt.hr(renderWidth, frameColor))
      .toString();
  },
} as const;

function formatTitle(permissions: t.PiCli.PermissionMode, width: number) {
  const label = permissions === 'allow-all'
    ? c.bold(c.yellow('pi:no-sandbox'))
    : c.bold(c.cyan('pi:sandbox'));
  const labelWidth = visibleWidth(label);
  const opsWidth = visibleWidth(TOOL_OPS);

  if (labelWidth + opsWidth + 1 > width) return label;

  const gap = ' '.repeat(width - labelWidth - opsWidth);
  return `${label}${gap}${c.dim(c.cyan(TOOL_OPS))}`;
}

function sandboxRenderWidth(width = Cli.Screen.size().width) {
  const measured = Is.num(width) && width > 0 ? width : Cli.Screen.size().width;
  return Num.clamp(0, measured, measured - SANDBOX_EDGE_MARGIN);
}

function sandboxContentBudget(renderWidth: number) {
  return Num.clamp(0, renderWidth, renderWidth - SANDBOX_TABLE_MARGIN);
}

function formatReportPath(path: t.StringPath, budget: number, cwd: t.StringDir) {
  const trimmed = Fs.trimCwd(path, { cwd });
  const fitted = fitDisplayPath(trimmed, budget);
  return Cli.Fmt.Path.str(fitted);
}

function fitDisplayPath(path: string, budget: number) {
  if (budget <= 0) return '';
  if (visibleWidth(path) <= budget) return path;

  const hasTrailingSlash = path.endsWith('/');
  const body = hasTrailingSlash ? path.slice(0, -1) : path;
  const basename = Path.basename(body);
  const suffix = hasTrailingSlash ? '/' : '';
  const tail = `${basename}${suffix}`;

  if (basename.length === 0 || basename === body) return fitPreviewPathToBudget(path, budget);
  if (visibleWidth(tail) >= budget) return fitPreviewPathToBudget(tail, budget);

  const dirname = Path.dirname(body);
  if (dirname === '.' || dirname.length === 0) return tail;

  const separatorWidth = visibleWidth('/');
  const dirBudget = budget - visibleWidth(tail) - separatorWidth;
  if (dirBudget <= 0) return fitPreviewPathToBudget(tail, budget);
  if (visibleWidth(dirname) <= dirBudget) return `${dirname}/${tail}`;

  const left = dirBudget > PATH_DIR_PREFIX_WIDTH + PREVIEW_ELLIPSIS.length
    ? PATH_DIR_PREFIX_WIDTH
    : 0;
  const right = Math.max(0, dirBudget - left - PREVIEW_ELLIPSIS.length);
  const shortenedDir = Str.ellipsize(dirname, [left, right], PREVIEW_ELLIPSIS);
  return `${shortenedDir}/${tail}`;
}

function formatPermissions(input: t.PiCli.PermissionMode) {
  return input === 'allow-all' ? c.yellow(input) : c.gray(input);
}

function pushWriteRows(
  table: ReturnType<typeof Cli.table>,
  cwd: t.StringDir,
  input: t.PiCli.SandboxSummary.Scope | undefined,
  budget: number,
) {
  const summary = new Set(input?.summary ?? []);
  pushWriteBucket(table, 'write:cwd', [cwd], cwd, budget);
  if (summary.has('temp')) {
    const temp = (input?.detail ?? []).filter((path) => isTempWritePath(path, cwd));
    pushWriteBucket(table, '     :tmp', temp, cwd, budget);
  }
  const extra = (input?.detail ?? []).filter((path) => !isTempWritePath(path, cwd));
  if (summary.has('extra') || extra.length > 0) {
    pushWriteBucket(table, '   :extra', extra, cwd, budget);
  }
}

function formatPreview(input: readonly t.StringPath[], budget: number, cwd?: t.StringDir) {
  const items = input.map((path) => cwd ? previewPath(path, cwd) : prettyPath(path));
  if (items.length === 0) return c.dim('-');

  const fit = fitPreview(items, budget);
  const parts = fit.visible.map((item) => c.gray(item));
  if (fit.hidden > 0) parts.push(c.italic(c.cyan(moreLabel(fit.hidden))));

  return parts.join(c.gray(', '));
}

function fitPreview(input: readonly string[], budget: number): PreviewFit {
  for (let visibleCount = input.length; visibleCount >= 1; visibleCount--) {
    const hidden = input.length - visibleCount;
    const visible = input.slice(0, visibleCount);

    for (const profile of PREVIEW_PROFILES) {
      const candidate = visible.map((path) => fitPreviewPath(path, profile));
      if (previewFits(candidate, hidden, budget)) return { visible: candidate, hidden };
    }
  }

  return fallbackPreviewFit(input, budget);
}

function fallbackPreviewFit(input: readonly string[], budget: number): PreviewFit {
  if (input.length === 0) return { visible: [], hidden: 0 };
  if (input.length === 1) return { visible: [fitPreviewPathToBudget(input[0], budget)], hidden: 0 };

  const hidden = input.length - 1;
  const suffix = moreLabel(hidden);
  const separatorWidth = visibleWidth(', ');
  const suffixWidth = visibleWidth(suffix);
  const itemBudget = budget - suffixWidth - separatorWidth;

  if (itemBudget > 0) {
    return {
      visible: [fitPreviewPathToBudget(input[0], itemBudget)],
      hidden,
    };
  }

  return { visible: [fitPreviewPathToBudget(input[0], budget)], hidden: 0 };
}

function fitPreviewPath(path: string, profile: readonly [number, number]) {
  return Str.ellipsize(path, profile, PREVIEW_ELLIPSIS);
}

function fitPreviewPathToBudget(path: string, budget: number) {
  if (budget <= 0) return '';
  if (visibleWidth(path) <= budget) return path;
  if (budget === 1) return '.';
  if (budget === 2) return PREVIEW_ELLIPSIS;
  return Str.ellipsize(path, [0, budget - PREVIEW_ELLIPSIS.length], PREVIEW_ELLIPSIS);
}

function previewFits(visible: readonly string[], hidden: number, budget: number) {
  return visibleWidth(joinPreviewParts(visible, hidden)) <= budget;
}

function joinPreviewParts(visible: readonly string[], hidden: number) {
  const parts = [...visible];
  if (hidden > 0) parts.push(moreLabel(hidden));
  return parts.join(', ');
}

function visibleWidth(text: string) {
  return Cli.stripAnsi(text).length;
}

function moreLabel(count: number) {
  return `+${count} more`;
}

function cwdAndDetail(cwd: t.StringDir, input: readonly t.StringPath[]) {
  return [cwd, ...input];
}

function pushWriteBucket(
  table: ReturnType<typeof Cli.table>,
  label: string,
  input: readonly t.StringPath[],
  cwd: t.StringDir,
  budget: number,
) {
  if (input.length === 0) return;
  const markerBudget = label === 'write:cwd' ? visibleWidth(WRITE_CWD_MARKER) : 0;
  const [head, ...tail] = input.map((path, position) => {
    const pathBudget = position === 0 ? Math.max(0, budget - markerBudget) : budget;
    return formatWritePath(path, cwd, pathBudget);
  });
  const lead = label === 'write:cwd' ? `${head}${c.dim(c.cyan(WRITE_CWD_MARKER))}` : head;
  table.push([c.magenta(label), lead]);
  for (const item of tail) table.push(['', item]);
}

function prettyPath(path: t.StringPath) {
  const trimmed = Fs.trimCwd(path);
  return trimmed.length > 0 ? trimmed : path;
}

function formatWritePath(path: t.StringPath, cwd: t.StringDir, budget: number) {
  const normalized = normalizeWritePath(path, cwd);
  const fitted = fitDisplayPath(normalized, budget);
  return c.gray(Cli.Fmt.path(fitted, (e) => {
    if (e.is.basename) e.change(c.magenta(e.part));
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

function isTempWritePath(path: t.StringPath, cwd: t.StringDir) {
  if (path === cwd) return false;
  const trimmed = prettyPath(path);
  if (trimmed.startsWith('/var/folders/')) return true;
  if (trimmed.startsWith('/tmp/')) return true;
  return false;
}
