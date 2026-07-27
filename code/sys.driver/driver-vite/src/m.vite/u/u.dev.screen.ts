import { ViteLog } from '../../m.fmt/mod.ts';
import { digestSuffixes, metadataRow } from '../../m.fmt/u.ts';
import { c, Cli, Is, Path, Str, stripAnsi, type t, Time } from '../common.ts';
import { DevOutputLog } from './u.dev.output.ts';

type Output = ReturnType<typeof DevOutputLog.create>;
type OutputLine = ReturnType<Output['lines']>[number];
type ReporterMode = t.Vite.Dev.ReporterMode;

type ReporterHandle = {
  redraw(): void;
  redrawSoon(): void;
  clearLog(): void;
  toggleOptions(): void;
  toggleExtended(ws: t.ViteDenoWorkspace): void;
  dispose(): void;
};

type StartupHandle = {
  redraw(): void;
  redrawSoon(): void;
  dispose(): void;
};

type StartupSpinner = {
  text: string;
  start(): StartupSpinner;
  stop(): StartupSpinner;
  render?: () => unknown;
};

type ReporterDeps = {
  clear?: () => void;
  print?: (text: string) => void;
};

type StartupDeps = {
  clear?: () => void;
  print?: (text: string) => void;
  spinner?: () => StartupSpinner;
};

type ReporterResolveArgs = {
  readonly silent?: boolean;
  readonly hasPkg?: boolean;
  readonly isInteractive?: () => boolean;
};

type ReporterCreateArgs = {
  pkg: t.Pkg;
  dist?: t.DistPkg;
  paths: t.ViteConfig.Paths;
  url: () => string;
  output: Output;
  logLines?: number;
  deps?: ReporterDeps;
};

type StartupCreateArgs = {
  pkg: t.Pkg;
  dist?: t.DistPkg;
  paths: t.ViteConfig.Paths;
  url: () => string;
  output: Output;
  logLines?: number;
  deps?: StartupDeps;
};

type FrameArgs = {
  pkg: t.Pkg;
  dist?: t.DistPkg;
  paths: t.ViteConfig.Paths;
  url: string;
  lines: readonly OutputLine[];
  logLines?: number;
  showOptions?: boolean;
  ws?: t.ViteDenoWorkspace;
  width?: number;
  height?: number;
};

type StartupFrameArgs = FrameArgs & {
  spinner?: string;
};

const DEFAULT_LOG_LINES = 10;
const MAX_LOG_LINES = 200;
const REDRAW_MSEC = 50 as t.Msecs;
const ELLIPSIS_SENTINEL = '\uE000';

/**
 * Stable parent-owned reporter for Vite dev output.
 */
export const DevScreen = {
  resolveReporter(input: unknown, options: ReporterResolveArgs): ReporterMode {
    const mode = wrangle.reporterMode(input);
    if (mode === 'raw') return 'raw';
    if (mode === 'screen') return options.silent || !options.hasPkg ? 'raw' : 'screen';
    if (options.silent || !options.hasPkg) return 'raw';
    return (options.isInteractive ?? wrangle.isInteractive)() ? 'screen' : 'raw';
  },

  logLines: (input?: unknown) => wrangle.logLines(input),

  create(args: ReporterCreateArgs): ReporterHandle {
    const { pkg, dist, paths, output } = args;
    const clear = args.deps?.clear ?? (() => console.clear());
    const print = args.deps?.print ?? ((text) => console.info(text));
    const logLines = wrangle.logLines(args.logLines);
    let showOptions = false;
    let ws: t.ViteDenoWorkspace | undefined;
    let redrawTimer: t.Time.Delay.Promise | undefined;

    const snapshot = () =>
      DevScreen.toString({
        pkg,
        dist,
        paths,
        url: args.url(),
        lines: output.lines(),
        logLines,
        showOptions,
        ws,
      });

    const redraw = () => {
      redrawTimer?.cancel();
      redrawTimer = undefined;
      clear();
      print(snapshot());
    };

    return {
      redraw,

      redrawSoon() {
        if (redrawTimer) return;
        redrawTimer = Time.delay(REDRAW_MSEC, redraw);
      },

      clearLog() {
        output.clearLines();
        redraw();
      },

      toggleOptions() {
        showOptions = !showOptions;
        redraw();
      },

      toggleExtended(next) {
        ws = ws ? undefined : next;
        redraw();
      },

      dispose() {
        redrawTimer?.cancel?.();
        redrawTimer = undefined;
      },
    };
  },

  createStartup(args: StartupCreateArgs): StartupHandle {
    const { pkg, dist, paths, output } = args;
    const clear = args.deps?.clear ?? (() => console.clear());
    const print = args.deps?.print ?? ((text) => console.error(text));
    const spinner = (args.deps?.spinner ?? (() => Cli.Spinner.create('') as StartupSpinner))();
    const logLines = wrangle.logLines(args.logLines);
    let redrawTimer: t.Time.Delay.Promise | undefined;
    let disposed = false;
    let started = false;

    const body = () =>
      DevScreen.startupBody({
        pkg,
        dist,
        paths,
        url: args.url(),
        lines: output.lines(),
        logLines,
      });

    const redraw = () => {
      if (disposed) return;
      redrawTimer?.cancel();
      redrawTimer = undefined;
      spinner.text = `\n${body()}`;
      if (started) spinner.render?.();
    };

    clear();
    print(wrangle.startupHeader(pkg));
    redraw();
    spinner.start();
    started = true;

    return {
      redraw,

      redrawSoon() {
        if (disposed || redrawTimer) return;
        redrawTimer = Time.delay(REDRAW_MSEC, redraw);
      },

      dispose() {
        if (disposed) return;
        disposed = true;
        redrawTimer?.cancel?.();
        redrawTimer = undefined;
        started = false;
        spinner.stop();
      },
    };
  },

  startupBody(args: StartupFrameArgs) {
    return wrangle.startupBody(args);
  },

  startupToString(args: StartupFrameArgs) {
    const spinner = args.spinner ?? '⠋';
    const body = DevScreen.startupBody(args);
    return `${wrangle.startupHeader(args.pkg, args.width)}\n${spinner}\n${body}`.trimEnd();
  },

  toString(args: FrameArgs) {
    const { width, height } = wrangle.size(args.width, args.height);
    const hr = c.brightGreen(c.bold(Cli.Fmt.hr({ width })));
    const subHr = c.dim(Cli.Fmt.hr({ width, color: 'green', weight: 'dashed' }));
    const input = Path.trimCwd(args.paths.app.entry);
    const outDir = Path.trimCwd(args.paths.app.outDir);
    const prefix = (indexWidth: number) => {
      const contentColumn = wrangle.contentColumn(indexWidth);
      const indent = wrangle.indent(contentColumn);
      const lines = [
        wrangle.header(args.pkg, width),
        hr,
        '',
        wrangle.info(args.url, contentColumn, width),
        `${indent}${c.green('↑')}`,
        metadataRow({
          label: 'input',
          value: input,
          width,
          indent: contentColumn,
          labelWidth: 9,
          styledLabel: c.green('input'),
        }),
        metadataRow({
          label: 'output',
          value: outDir,
          width,
          indent: contentColumn,
          labelWidth: 9,
          styledLabel: c.white('output'),
          suffixes: digestSuffixes(args.dist?.hash.digest),
        }),
      ];
      if (args.ws) lines.splice(2, 0, '', args.ws.toString({ width }));
      if (args.showOptions) lines.push('', wrangle.options(subHr, contentColumn));
      lines.push('', subHr);
      return lines.join('\n').trimEnd();
    };
    const rowCount = Math.min(
      wrangle.logLines(args.logLines),
      wrangle.availableRows(height, wrangle.lineCount(prefix(1))),
    );
    const visible = rowCount === 0 ? [] : args.lines.slice(-rowCount);
    const indexWidth = wrangle.indexWidth(visible);
    const head = prefix(indexWidth);
    const rows = visible.map((line) => wrangle.logRow(line, width, indexWidth));
    const frame = rows.length ? `${head}\n${rows.join('\n')}` : head;

    return wrangle.clipLines(wrangle.clipFrameWidth(frame, width), height).trimEnd();
  },
} as const;

/**
 * Helpers:
 */
const wrangle = {
  reporterMode(input: unknown): ReporterMode {
    if (input === undefined || input === 'auto') return 'auto';
    if (input === 'screen' || input === 'raw') return input;
    throw new Error(`Vite.dev: unsupported reporter mode: ${String(input)}`);
  },

  isInteractive() {
    try {
      return Deno.stdin.isTerminal() && Deno.stdout.isTerminal();
    } catch {
      return false;
    }
  },

  logLines(input?: unknown) {
    const value = Is.num(input) ? input : Is.string(input) ? Number(input) : undefined;
    return Is.num(value)
      ? Math.min(MAX_LOG_LINES, Math.max(0, Math.floor(value)))
      : DEFAULT_LOG_LINES;
  },

  size(width?: number, height?: number) {
    const measured = Cli.Screen.size();
    return {
      width: wrangle.dimension(width, measured.width),
      height: wrangle.dimension(height, measured.height),
    };
  },

  startupHeader(pkg: t.Pkg, inputWidth?: number) {
    const { width } = wrangle.size(inputWidth);
    const hr = c.brightGreen(c.bold(Cli.Fmt.hr({ width })));
    return [wrangle.header(pkg, width), hr].join('\n').trimEnd();
  },

  startupBody(args: StartupFrameArgs) {
    const { width, height } = wrangle.size(args.width, args.height);
    const subHr = c.dim(Cli.Fmt.hr({ width, color: 'green', weight: 'dashed' }));
    const lines = args.lines;
    const indexWidth = wrangle.indexWidth(lines);
    const contentColumn = wrangle.contentColumn(indexWidth);
    const indent = wrangle.indent(contentColumn);
    const input = Path.trimCwd(args.paths.app.entry);
    const outDir = Path.trimCwd(args.paths.app.outDir);
    const head = [
      wrangle.info(args.url, contentColumn, width),
      `${indent}${c.green('↑')}`,
      metadataRow({
        label: 'input',
        value: input,
        width,
        indent: contentColumn,
        labelWidth: 9,
        styledLabel: c.green('input'),
      }),
      metadataRow({
        label: 'output',
        value: outDir,
        width,
        indent: contentColumn,
        labelWidth: 9,
        styledLabel: c.white('output'),
        suffixes: digestSuffixes(args.dist?.hash.digest),
      }),
      '',
      subHr,
    ].join('\n').trimEnd();
    const rowCount = Math.min(
      wrangle.logLines(args.logLines),
      wrangle.availableRows(height, wrangle.lineCount(head)),
    );
    const visible = rowCount === 0 ? [] : lines.slice(-rowCount);
    const rows = visible.map((line) => wrangle.logRow(line, width, indexWidth));
    const frame = rows.length ? `${head}\n${rows.join('\n')}` : head;
    return wrangle.clipLines(wrangle.clipFrameWidth(frame, width), height).trimEnd();
  },

  dimension(input: number | undefined, fallback: number) {
    const value = Is.num(input) ? input : fallback;
    return Math.max(0, Math.floor(value));
  },

  lineCount(text: string) {
    return stripAnsi(text).split('\n').length;
  },

  availableRows(height: number, prefixRows: number) {
    return Math.max(0, height - prefixRows);
  },

  clipLines(text: string, height: number) {
    if (height === 0) return '';
    const lines = text.split('\n');
    return lines.length <= height ? text : lines.slice(0, height).join('\n');
  },

  clipFrameWidth(text: string, width: number) {
    if (width === 0) return '';
    return text.split('\n').map((line) => wrangle.clipFrameLine(line, width)).join('\n');
  },

  clipFrameLine(line: string, width: number) {
    if (Cli.Fmt.Text.Width.measure(line) <= width) return line;
    return c.gray(wrangle.clipMiddleText(stripAnsi(line), width));
  },

  contentColumn(indexWidth: number) {
    return 1 + Math.max(1, indexWidth) + 2 + 3 + 2;
  },

  indent(width: number) {
    return ' '.repeat(Math.max(0, width));
  },

  header(pkg: t.Pkg, width: number) {
    if (width === 0) return '';

    const name = pkg.name;
    const version = pkg.version.trim();
    const scoped = wrangle.moduleName(name);
    const unscoped = wrangle.unscopedModuleName(scoped);
    const renderName = (text: string) => c.green(c.bold(text));
    const renderVersion = (text: string) => c.dim(c.green(text));
    const split = (text: string) => {
      if (!version) return undefined;
      const gap = width -
        Cli.Fmt.Text.Width.measure(text) -
        Cli.Fmt.Text.Width.measure(version);
      return gap >= 1
        ? `${renderName(text)}${wrangle.indent(gap)}${renderVersion(version)}`
        : undefined;
    };
    const renderIfFits = (text: string) => {
      return Cli.Fmt.Text.Width.measure(text) <= width ? renderName(text) : undefined;
    };

    return split(scoped) ??
      split(unscoped) ??
      renderIfFits(scoped) ??
      renderIfFits(unscoped) ??
      renderName(wrangle.clipMiddleText(unscoped, width));
  },

  moduleName(name: string) {
    return name.trim() || 'unknown';
  },

  unscopedModuleName(name: string) {
    const index = name.lastIndexOf('/');
    const value = index >= 0 ? name.slice(index + 1) : name;
    return value || name || 'unknown';
  },

  info(href: string, contentColumn: number, width: number) {
    const url = new URL(href);
    const text = `${url.protocol}//${url.hostname}:${url.port}/`;
    const valueWidth = Cli.Fmt.Text.Width.fit({ width, reserve: contentColumn, terminal: false });
    const indent = wrangle.indent(contentColumn);
    if (Cli.Fmt.Text.Width.measure(text) > valueWidth) {
      return `${indent}${c.cyan(wrangle.clipMiddleText(text, valueWidth))}`;
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

  indexWidth(lines: readonly OutputLine[]) {
    return Math.max(1, ...lines.map((line) => String(line.index).length));
  },

  logRow(line: OutputLine, width: number, indexWidth: number) {
    const index = c.gray(String(line.index).padStart(indexWidth, ' '));
    const source = line.source === 'stderr' ? c.yellow('err') : c.gray('out');
    const messageGap = '  ';
    const prefix = ` ${index}  ${source}${messageGap}`;
    const textWidth = width <= 0 ? 0 : Cli.Fmt.Text.Width.fit({
      width,
      reserve: Cli.Fmt.Text.Width.measure(prefix),
      terminal: false,
    });
    const text = wrangle.clipMiddle(stripAnsi(line.text).trim(), textWidth);
    return `${prefix}${text}`;
  },

  clipMiddleText(text: string, width: number) {
    if (width === 0) return '';
    if (Cli.Fmt.Text.Width.measure(text) <= width) return text;
    return Str.ellipsize(text, width);
  },

  clipMiddle(text: string, width: number) {
    if (width === 0) return '';
    if (Cli.Fmt.Text.Width.measure(text) <= width) return text;
    return Str.ellipsize(text, width, { ellipsis: ELLIPSIS_SENTINEL }).replace(
      ELLIPSIS_SENTINEL,
      c.gray('…'),
    );
  },
} as const;
