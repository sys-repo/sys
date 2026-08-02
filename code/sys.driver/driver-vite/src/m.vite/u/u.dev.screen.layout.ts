import { clipLine, clipText, clipValue, digestSuffixes, metadataRow } from '../../m.fmt/u.ts';
import { c, Cli, Is, Num, Path, stripAnsi, type t, Time } from '../common.ts';

type OutputLine = t.ViteDev.Output.Line;
type FrameArgs = t.ViteDev.Screen.Frame.Args;
type Viewport = t.ViteDev.Screen.Frame.Viewport;

const COMPACT_METADATA_MAX_WIDTH = 80;
const DEFAULT_LOG_LINES = 10;
const LOG_COLUMN_GAP = 2;
const LOG_ROW_GUTTER = 1;
const LOG_SOURCE_WIDTH = 3;
const MAX_LOG_LINES = 200;

/** Dev-screen frame layout isolated from runtime lifecycle effects. */
export const DevScreenLayout = {
  logLines: (input?: unknown) => wrangle.logLines(input),

  startup(args: t.ViteDev.Screen.Frame.StartupArgs): t.ViteDev.Screen.Frame.StartupOutput {
    const viewport = wrangle.viewport(args.viewport);
    const capacity = wrangle.capacity(viewport, args.cursorRows);
    const headerRows = wrangle.applicationHeader(args.pkg, viewport.width);
    const visibleHeader = headerRows.slice(0, capacity);
    const showSpinner = viewport.width > 0 && capacity > visibleHeader.length;
    const bodyCapacity = Math.max(0, capacity - visibleHeader.length - (showSpinner ? 1 : 0));
    const coreRowCount = wrangle.startupCore(args, viewport.width, 1).length;
    const visibleCount = Math.min(
      wrangle.logLines(args.logLines),
      Math.max(0, bodyCapacity - coreRowCount),
    );
    const visible = visibleCount === 0 ? [] : args.lines.slice(-visibleCount);
    const indexWidth = wrangle.indexWidth(visible);
    const bodyRows = [
      ...wrangle.startupCore(args, viewport.width, indexWidth),
      ...visible.map((line) => wrangle.logRow(line, viewport.width, indexWidth)),
    ];

    return {
      header: wrangle.renderRows(visibleHeader, viewport.width),
      body: wrangle.renderRows(bodyRows.slice(0, bodyCapacity), viewport.width),
      showSpinner,
    };
  },

  startupToString(args: t.ViteDev.Screen.Frame.StartupArgs) {
    const output = DevScreenLayout.startup(args);
    const rows = [
      output.header,
      output.showSpinner ? args.spinner ?? '⠋' : '',
      output.body,
    ].filter(Boolean);
    return rows.join('\n').trimEnd();
  },

  toString(args: t.ViteDev.Screen.Frame.ReadyArgs) {
    const viewport = wrangle.viewport(args.viewport);
    const { width } = viewport;
    const capacity = wrangle.capacity(viewport, args.cursorRows);
    const subHr = c.dim(Cli.Fmt.hr({ width, color: 'green', weight: 'dashed' }));
    const headerRows = wrangle.applicationHeader(args.pkg, width);
    const separator = ['', subHr];
    const workspace = wrangle.workspace(args.ws, width);
    const optionContent = args.showOptions ? wrangle.options(subHr, 1).split('\n') : [];
    const fixedRowCount = headerRows.length + wrangle.readyMetadata(args, width, 1).length +
      separator.length;
    const available = Math.max(0, capacity - fixedRowCount);
    const optionalRows = wrangle.optionalRowCount(workspace) +
      wrangle.optionalRowCount(optionContent);
    const logCount = Math.min(
      wrangle.logLines(args.logLines),
      Math.max(0, available - optionalRows),
    );
    const optionalCapacity = Math.max(0, available - logCount);
    const optionBudget = Math.min(optionalCapacity, wrangle.optionalRowCount(optionContent));
    const visibleOptions = wrangle.fitOptional(optionContent, optionBudget);
    const workspaceBudget = Math.max(0, optionalCapacity - visibleOptions.length);
    const visibleWorkspace = wrangle.fitOptional(workspace, workspaceBudget);
    const visible = logCount === 0 ? [] : args.lines.slice(-logCount);
    const indexWidth = wrangle.indexWidth(visible);
    const metadata = wrangle.readyMetadata(args, width, indexWidth);
    const options = args.showOptions
      ? wrangle.fitOptional(
        wrangle.options(subHr, wrangle.contentColumn(indexWidth)).split('\n'),
        optionBudget,
      )
      : [];
    const rows = [
      ...headerRows,
      ...visibleWorkspace,
      ...metadata,
      ...options,
      ...separator,
      ...visible.map((line) => wrangle.logRow(line, width, indexWidth)),
    ];

    return wrangle.renderRows(rows.slice(0, capacity), width);
  },
} as const;

/**
 * Helpers:
 */
const wrangle = {
  logLines(input?: unknown) {
    const value = Is.num(input) ? input : Is.string(input) ? Number(input) : undefined;
    return Is.num(value)
      ? Math.min(MAX_LOG_LINES, Math.max(0, Math.floor(value)))
      : DEFAULT_LOG_LINES;
  },

  viewport(input: Viewport): Viewport {
    return {
      width: wrangle.dimension(input.width),
      height: wrangle.dimension(input.height),
    };
  },

  dimension(input: number) {
    return Num.Is.finite(input) ? Math.max(0, Math.floor(input)) : 0;
  },

  capacity(viewport: Viewport, cursorRows: number) {
    return Math.max(0, viewport.height - wrangle.dimension(cursorRows));
  },

  applicationHeader(pkg: t.Pkg, width: number) {
    const title = wrangle.packageTitle(pkg.name);
    return Cli.Fmt.Header.rows({ pkg, width, tone: 'green', ...(title ? { title } : {}) });
  },

  packageTitle(name: string) {
    const firstSlash = name.indexOf('/');
    const subpathAt = name.startsWith('@') ? name.indexOf('/', firstSlash + 1) : firstSlash;
    if (subpathAt < 0) return;

    const packageName = name.slice(0, subpathAt);
    const subpath = name.slice(subpathAt);
    return `${c.bold(c.green(packageName))}${c.dim(c.green(subpath))}`;
  },

  startupCore(args: FrameArgs, width: number, indexWidth: number) {
    const metadataColumn = wrangle.metadataColumn(width, indexWidth);
    const indent = wrangle.indent(metadataColumn);
    const input = Path.trimCwd(args.paths.app.entry);
    const outDir = Path.trimCwd(args.paths.app.outDir);
    const subHr = c.dim(Cli.Fmt.hr({ width, color: 'green', weight: 'dashed' }));
    return [
      wrangle.info(args.url, metadataColumn, width),
      `${indent}${c.green('↑')}`,
      metadataRow({
        label: 'input',
        value: input,
        width,
        indent: metadataColumn,
        labelWidth: 9,
        styledLabel: c.green('input'),
      }),
      metadataRow({
        label: 'output',
        value: outDir,
        width,
        indent: metadataColumn,
        labelWidth: 9,
        styledLabel: c.white('output'),
        suffixes: wrangle.distSuffixes(args.dist, args.renderedAt),
      }),
      '',
      subHr,
    ];
  },

  readyMetadata(args: FrameArgs, width: number, indexWidth: number) {
    const metadataColumn = wrangle.metadataColumn(width, indexWidth);
    const indent = wrangle.indent(metadataColumn);
    const input = Path.trimCwd(args.paths.app.entry);
    const outDir = Path.trimCwd(args.paths.app.outDir);
    return [
      '',
      wrangle.info(args.url, metadataColumn, width),
      `${indent}${c.green('↑')}`,
      metadataRow({
        label: 'input',
        value: input,
        width,
        indent: metadataColumn,
        labelWidth: 9,
        styledLabel: c.green('input'),
      }),
      metadataRow({
        label: 'output',
        value: outDir,
        width,
        indent: metadataColumn,
        labelWidth: 9,
        styledLabel: c.white('output'),
        suffixes: wrangle.distSuffixes(args.dist, args.renderedAt),
      }),
    ];
  },

  distSuffixes(dist: t.DistPkg | undefined, renderedAt: t.UnixTimestamp) {
    if (!dist) return [];
    const age = Time.elapsed(dist.build.time, renderedAt).toString();
    const suffix = c.dim(c.gray(`· ${age}`));
    return digestSuffixes(dist.hash.digest).map((digest) => `${digest} ${suffix}`);
  },

  workspace(ws: t.ViteDenoWorkspace | undefined, width: number) {
    if (!ws) return [];
    const text = ws.toString({ width }).trimEnd();
    return text ? text.split('\n') : [];
  },

  optionalRowCount(lines: string[]) {
    return lines.length === 0 ? 0 : lines.length + 1;
  },

  fitOptional(lines: string[], capacity: number) {
    if (lines.length === 0 || capacity <= 0) return [];
    if (capacity === 1) return [lines[0]];
    return ['', ...lines.slice(0, capacity - 1)];
  },

  renderRows(rows: string[], width: number) {
    if (width === 0 || rows.length === 0) return '';
    return rows.map((line) => clipLine(line, width)).join('\n').trimEnd();
  },

  sourceColumn(indexWidth: number) {
    return LOG_ROW_GUTTER + Math.max(1, indexWidth) + LOG_COLUMN_GAP;
  },

  contentColumn(indexWidth: number) {
    return wrangle.sourceColumn(indexWidth) + LOG_SOURCE_WIDTH + LOG_COLUMN_GAP;
  },

  metadataColumn(width: number, indexWidth: number) {
    return width <= COMPACT_METADATA_MAX_WIDTH
      ? wrangle.sourceColumn(indexWidth)
      : wrangle.contentColumn(indexWidth);
  },

  indent(width: number) {
    return ' '.repeat(Math.max(0, width));
  },

  info(href: string, column: number, width: number) {
    const url = new URL(href);
    const text = `${url.protocol}//${url.hostname}:${url.port}/`;
    const valueWidth = Cli.Fmt.Text.Width.fit({ width, reserve: column, terminal: false });
    const indent = wrangle.indent(column);
    if (Cli.Fmt.Text.Width.measure(text) > valueWidth) {
      return `${indent}${c.cyan(clipText(text, valueWidth))}`;
    }

    const port = c.bold(c.brightCyan(url.port));
    return c.cyan(`${indent}${url.protocol}//${url.hostname}:${port}/`);
  },

  options(subHr: string, contentColumn: number) {
    const key = (text: string) => c.bold(c.white(text));
    return [
      `${c.green(c.bold('options'))}${c.dim(c.green(':'))}`,
      subHr,
      wrangle.optionRow('close', key('i'), contentColumn),
      wrangle.optionRow('more', key('shift + i'), contentColumn),
      wrangle.optionRow('clear', key('k'), contentColumn),
      wrangle.optionRow('open', key('o'), contentColumn, c.dim('← (in browser)')),
      wrangle.optionRow('quit', key('ctrl + c'), contentColumn),
    ].join('\n');
  },

  optionRow(label: string, value: string, contentColumn: number, suffix = '') {
    const gap = wrangle.indent(Math.max(1, contentColumn - label.length));
    const tail = suffix ? `  ${suffix}` : '';
    return `${label}${gap}${value}${tail}`;
  },

  indexWidth(lines: OutputLine[]) {
    return Math.max(1, ...lines.map((line) => String(line.index).length));
  },

  logRow(line: OutputLine, width: number, indexWidth: number) {
    const rowWidth = wrangle.dimension(width - LOG_ROW_GUTTER);
    const index = c.gray(String(line.index).padStart(indexWidth, ' '));
    const source = line.source === 'stderr' ? c.yellow('err') : c.gray('out');
    const gap = wrangle.indent(LOG_COLUMN_GAP);
    const prefix = `${wrangle.indent(LOG_ROW_GUTTER)}${index}${gap}${source}${gap}`;
    const textWidth = Cli.Fmt.Text.Width.fit({
      width: rowWidth,
      reserve: Cli.Fmt.Text.Width.measure(prefix),
      terminal: false,
    });
    const text = clipValue(stripAnsi(line.text).trim(), textWidth);
    return clipLine(`${prefix}${text}`, rowWidth);
  },
} as const;
