import { c, Cli, Fs, Is, Num, Path, pkg, Str, type t } from './common.ts';
import { isGitlessRoot, runtimeRoot } from './u.runtime.ts';

type PiSandboxTableOptions = {
  readonly width?: number;
  readonly gitRootExplicit?: boolean;
  /** Terminal-output override for deterministic rendering tests. */
  readonly terminal?: boolean;
};

type PreviewFit = {
  readonly visible: readonly string[];
  readonly hidden: number;
};

type Marker = {
  readonly text: string;
  readonly explicit?: boolean;
};

type ReportLink = {
  readonly display: string;
  readonly href: URL;
};

const SANDBOX_EDGE_MARGIN = 1;
const SANDBOX_TABLE_LABEL_WIDTH = Cli.Fmt.Text.Width.measure('permissions');
const SANDBOX_TABLE_GAP = 3;
const SANDBOX_TABLE_MARGIN = SANDBOX_TABLE_LABEL_WIDTH + SANDBOX_TABLE_GAP + 1;
const PREVIEW_ELLIPSIS = '..';
const PREVIEW_PROFILES: readonly (readonly [number, number])[] = [
  [10, 18],
  [6, 14],
  [3, 10],
];
const PATH_DIR_PREFIX_WIDTH = 4;
const WRITE_GIT_MARKER = ' (--git-root)';
const WRITE_ROOT_MARKER = ' (root)';
const CAPABILITY_OPS = 'read, write, bash';

const PI_SANDBOX_TITLE = {
  base: 'sys:pi',
  scoped: ':sandbox',
  allowAll: ':no-sandbox',
} as const;

/**
 * Pi sandbox CLI formatters.
 */
export const PiSandboxFmt = {
  title(permissions: t.PiCli.PermissionMode) {
    const suffix = permissions === 'allow-all'
      ? PI_SANDBOX_TITLE.allowAll
      : PI_SANDBOX_TITLE.scoped;
    const color = permissions === 'allow-all' ? c.yellow : c.cyan;
    return `${c.bold(color(PI_SANDBOX_TITLE.base))}${c.dim(color(suffix))}`;
  },

  /** Render the permission-truthful Pi application header. */
  header(
    permissions: t.PiCli.PermissionMode,
    renderWidth = sandboxRenderWidth(),
  ): readonly string[] {
    const tone = permissions === 'allow-all' ? 'yellow' : 'cyan';
    const identity = PiSandboxFmt.title(permissions);
    const flag = permissions === 'allow-all' ? c.yellow('--allow-all') : '';
    const title = flag ? `${identity} ${flag}` : identity;
    return Cli.Fmt.Header.rows({
      pkg,
      width: renderWidth,
      tone,
      title,
      detail: CAPABILITY_OPS,
    });
  },

  table(input: t.PiCli.SandboxSummary, opts: PiSandboxTableOptions = {}) {
    const renderWidth = sandboxRenderWidth(opts.width);
    const contentBudget = sandboxContentBudget(renderWidth);
    const table = Cli.table([]);

    const root = runtimeRoot(input.cwd);
    let reportLink: ReportLink | undefined;

    if (input.report) {
      const terminal = opts.terminal ?? Cli.Is.terminal('stdout');
      reportLink = terminal ? prepareReportLink(input.report, contentBudget) : undefined;
      const report = terminal
        ? (reportLink?.display ?? '')
        : formatReportPath(input.report, contentBudget, root);
      table.push([c.gray('report'), report]);
      table.push([c.gray('permissions'), formatPermissions(input.permissions)]);
    } else {
      table.push([c.gray('permissions'), formatPermissions(input.permissions)]);
      table.push([
        c.gray('context'),
        formatPreview(input.context?.include ?? [], contentBudget, root),
      ]);
      table.push([
        c.gray('read'),
        input.permissions === 'allow-all'
          ? c.yellow('all')
          : formatPreview(cwdAndDetail(root, input.read?.detail ?? []), contentBudget),
      ]);
      if (input.permissions === 'allow-all') table.push([c.yellow('write'), c.yellow('all')]);
      else {
        const marker = writeCwdMarker(input.cwd, opts.gitRootExplicit === true);
        pushWriteRows(table, root, input.write, contentBudget, marker);
      }
    }

    const [title = '', headerHr = ''] = PiSandboxFmt.header(input.permissions, renderWidth);
    const bodyHr = c.dim(
      Cli.Fmt.hr({ width: renderWidth, color: 'gray', weight: 'dashed' }),
    );
    const tableText = Str.trimEdgeNewlines(String(table));
    const body = reportLink
      ? tableText.replace(
        reportLink.display,
        () => Cli.Fmt.hyperlink(reportLink.display, reportLink.href),
      )
      : tableText;

    return Str.builder()
      .line(title)
      .line(headerHr)
      .line(body)
      .line(bodyHr)
      .toString();
  },
} as const;

function sandboxRenderWidth(width = Cli.Screen.size().width) {
  const measured = Is.num(width) && width > 0 ? width : Cli.Screen.size().width;
  return Num.clamp(0, measured, measured - SANDBOX_EDGE_MARGIN);
}

function sandboxContentBudget(renderWidth: number) {
  if (renderWidth <= 0) return 0;
  return Cli.Fmt.Text.Width.fit({
    width: renderWidth,
    reserve: SANDBOX_TABLE_MARGIN,
    terminal: false,
  });
}

function prepareReportLink(path: t.StringPath, budget: number): ReportLink | undefined {
  if (budget <= 0) return;

  const label = Path.basename(path);
  if (label.length === 0) return;
  const display = Cli.Fmt.Text.Width.measure(label) <= budget
    ? c.gray(label)
    : ellipsizeReportPath(label, budget);
  return {
    display: c.underline(display),
    href: Path.toFileUrl(path),
  };
}

function formatReportPath(path: t.StringPath, budget: number, cwd: t.StringDir) {
  if (budget <= 0) return '';

  const display = Fs.trimCwd(path, { cwd });
  const measure = Cli.Fmt.Text.Width.measure;
  if (measure(display) <= budget) return c.gray(display);

  const hasTrailingSlash = display.endsWith('/');
  const body = hasTrailingSlash ? display.slice(0, -1) : display;
  const basename = Path.basename(body);
  const suffix = hasTrailingSlash ? '/' : '';
  const tail = `${basename}${suffix}`;

  if (basename.length === 0 || basename === body || measure(tail) >= budget) {
    return ellipsizeReportPath(display, budget);
  }

  const dirname = Path.dirname(body);
  if (dirname === '.' || dirname.length === 0) return ellipsizeReportPath(display, budget);

  const separator = '/';
  const dirBudget = Cli.Fmt.Text.Width.fit({
    width: budget,
    reserve: measure(`${separator}${tail}`),
    terminal: false,
  });
  if (dirBudget <= 0) return ellipsizeReportPath(display, budget);
  if (measure(dirname) <= dirBudget) return c.gray(`${dirname}${separator}${tail}`);

  return `${ellipsizeReportPath(dirname, dirBudget)}${c.gray(`${separator}${tail}`)}`;
}

function ellipsizeReportPath(path: string, budget: number) {
  return Cli.Fmt.Text.ellipsize(path, budget, {
    ellipsis: PREVIEW_ELLIPSIS,
    render: ({ head, ellipsis, tail }) => `${c.gray(head)}${c.cyan(ellipsis)}${c.gray(tail)}`,
  });
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

  const ellipsisWidth = visibleWidth(PREVIEW_ELLIPSIS);
  const left = dirBudget > PATH_DIR_PREFIX_WIDTH + ellipsisWidth ? PATH_DIR_PREFIX_WIDTH : 0;
  const right = Math.max(0, dirBudget - left - ellipsisWidth);
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
  marker: Marker,
) {
  const summary = new Set(input?.summary ?? []);
  pushWriteBucket(table, 'write:cwd', [cwd], cwd, budget, marker);
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
  return Str.ellipsize(path, [0, budget - visibleWidth(PREVIEW_ELLIPSIS)], PREVIEW_ELLIPSIS);
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
  return Cli.Fmt.Text.Width.measure(text);
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
  marker?: Marker,
) {
  if (input.length === 0) return;
  const markerBudget = label === 'write:cwd' && marker ? visibleWidth(marker.text) : 0;
  const [head, ...tail] = input.map((path, position) => {
    const pathBudget = position === 0 ? Math.max(0, budget - markerBudget) : budget;
    return formatWritePath(path, cwd, pathBudget);
  });
  const lead = label === 'write:cwd' && marker ? `${head}${formatMarker(marker)}` : head;
  table.push([c.gray(label), lead]);
  for (const item of tail) table.push(['', item]);
}

function writeCwdMarker(cwd: t.PiCli.Cwd, explicit: boolean): Marker {
  return {
    text: isGitlessRoot(cwd) ? WRITE_ROOT_MARKER : WRITE_GIT_MARKER,
    explicit,
  };
}

function formatMarker(marker: Marker) {
  return marker.explicit === true ? c.cyan(marker.text) : c.dim(c.cyan(marker.text));
}

function prettyPath(path: t.StringPath) {
  const trimmed = Fs.trimCwd(path);
  return trimmed.length > 0 ? trimmed : path;
}

function formatWritePath(path: t.StringPath, cwd: t.StringDir, budget: number) {
  const normalized = normalizeWritePath(path, cwd);
  const fitted = fitDisplayPath(normalized, budget);
  return c.gray(Cli.Fmt.path(fitted, (e) => {
    if (e.is.basename) e.change(c.dim(c.magenta(e.part)));
  }));
}

function trimPath(
  path: t.StringPath,
  cwd: t.StringDir,
  opts: { sibling?: boolean } = {},
) {
  if (path === cwd) return Fs.trimCwd(path);
  const prefix = `${cwd}/`;
  if (path.startsWith(prefix)) return `./${path.slice(prefix.length)}`;

  const parent = Path.dirname(cwd);
  const parentPrefix = `${parent}/`;
  if (opts.sibling && Path.Is.absolute(path) && path.startsWith(parentPrefix)) {
    return `../${path.slice(parentPrefix.length)}`;
  }

  return path;
}

function normalizeWritePath(path: t.StringPath, cwd: t.StringDir) {
  return withTrailingSlash(path === cwd ? prettyPath(path) : trimPath(path, cwd));
}

function withTrailingSlash(path: string) {
  return path.endsWith('/') ? path : `${path}/`;
}

function previewPath(path: t.StringPath, cwd: t.StringDir) {
  if (path === cwd) return prettyPath(path);
  return trimPath(path, cwd, { sibling: true });
}

function isTempWritePath(path: t.StringPath, cwd: t.StringDir) {
  if (path === cwd) return false;
  const trimmed = prettyPath(path);
  if (trimmed.startsWith('/var/folders/')) return true;
  if (trimmed.startsWith('/tmp/')) return true;
  return false;
}
