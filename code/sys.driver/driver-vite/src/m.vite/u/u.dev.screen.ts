import { ViteLog } from '../../m.fmt/mod.ts';
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

type ReporterDeps = {
  clear?: () => void;
  print?: (text: string) => void;
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
        wrangle.valueRow('input', input, contentColumn, width, c.green('input')),
        wrangle.outputRow(outDir, args.dist?.hash.digest, contentColumn, width),
      ];
      if (args.ws) lines.splice(2, 0, '', args.ws.toString());
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
    if (Cli.Fmt.Text.visibleWidth(line) <= width) return line;
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

    const titleText = 'Dev';
    const title = c.brightGreen(c.bold(titleText));
    const titleWidth = Cli.Fmt.Text.visibleWidth(titleText);
    const name = pkg.name;
    const version = pkg.version.trim();
    const scoped = wrangle.moduleName(name);
    const scopedVersion = version ? `${scoped} ${version}` : scoped;
    const unscoped = wrangle.unscopedModuleName(scoped);
    const renderName = (text: string) => c.white(c.bold(text));
    const renderModule = (text: string) => {
      if (!version || !text.endsWith(` ${version}`)) return renderName(text);
      const base = text.slice(0, -1 * (` ${version}`).length);
      return `${renderName(base)} ${c.gray(version)}`;
    };
    const split = (right: string) => {
      const gap = width - titleWidth - Cli.Fmt.Text.visibleWidth(right);
      return gap >= 1 ? `${title}${wrangle.indent(gap)}${renderModule(right)}` : undefined;
    };
    const alignRight = (text: string) => {
      const gap = Math.max(0, width - Cli.Fmt.Text.visibleWidth(text));
      return `${wrangle.indent(gap)}${renderName(text)}`;
    };

    return split(scopedVersion) ??
      split(scoped) ??
      (Cli.Fmt.Text.visibleWidth(scoped) <= width ? alignRight(scoped) : undefined) ??
      (Cli.Fmt.Text.visibleWidth(unscoped) <= width ? alignRight(unscoped) : undefined) ??
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
    const valueWidth = Cli.Fmt.Text.fitWidth({ width, reserve: contentColumn, terminal: false });
    const indent = wrangle.indent(contentColumn);
    if (Cli.Fmt.Text.visibleWidth(text) > valueWidth) {
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

  valueRow(
    label: string,
    value: string,
    contentColumn: number,
    width: number,
    styledLabel: string,
  ) {
    const prefix = wrangle.valuePrefix(label, contentColumn, styledLabel);
    const valueWidth = Cli.Fmt.Text.fitWidth({
      width,
      reserve: Cli.Fmt.Text.visibleWidth(prefix),
      terminal: false,
    });
    return `${prefix}${wrangle.clipMiddle(value, valueWidth)}`;
  },

  valuePrefix(label: string, contentColumn: number, styledLabel: string) {
    const labelWidth = 9;
    const gap = wrangle.indent(Math.max(1, labelWidth - label.length));
    return `${wrangle.indent(contentColumn)}${styledLabel}${gap}`;
  },

  outputRow(outDir: string, hash: t.StringHash | undefined, contentColumn: number, width: number) {
    const prefix = wrangle.valuePrefix('output', contentColumn, c.white('output'));
    const base = `${prefix}${outDir}`;
    const candidates = wrangle.digestCandidates(hash);
    const digest = candidates.find((candidate) => {
      return Cli.Fmt.Text.visibleWidth(`${base} ${candidate}`) <= width;
    });
    if (digest) return `${base} ${digest}`;
    if (Cli.Fmt.Text.visibleWidth(base) <= width) return base;

    const outDirWidth = Cli.Fmt.Text.fitWidth({
      width,
      reserve: Cli.Fmt.Text.visibleWidth(prefix),
      terminal: false,
    });
    return `${prefix}${wrangle.clipMiddle(outDir, outDirWidth)}`;
  },

  digestCandidates(hash: t.StringHash | undefined) {
    if (!hash) return [];
    const parts = wrangle.digestParts(hash);
    const short = parts
      ? [
        wrangle.digest(`${parts.algorithm}:${parts.suffix}`),
        wrangle.digest(parts.suffix),
      ]
      : [];
    return [ViteLog.digest(hash), ...short];
  },

  digest(value: string) {
    return c.gray(`${c.green('←')} ${value}`);
  },

  digestParts(hash: t.StringHash) {
    const text = stripAnsi(ViteLog.digest(hash)).trim();
    const uri = text.replace(/^←\s*/, '');
    const uriParts = uri.split(':');
    if (uriParts.length >= 3 && uriParts[0] === 'digest') {
      return { algorithm: uriParts[1], suffix: uriParts.slice(2).join(':') };
    }

    const index = hash.indexOf('-');
    if (index <= 0) return undefined;
    return { algorithm: hash.slice(0, index), suffix: `#${hash.slice(-5)}` };
  },

  indexWidth(lines: readonly OutputLine[]) {
    return Math.max(1, ...lines.map((line) => String(line.index).length));
  },

  logRow(line: OutputLine, width: number, indexWidth: number) {
    const index = c.gray(String(line.index).padStart(indexWidth, ' '));
    const source = line.source === 'stderr' ? c.yellow('err') : c.gray('out');
    const messageGap = '  ';
    const prefix = ` ${index}  ${source}${messageGap}`;
    const textWidth = width <= 0 ? 0 : Cli.Fmt.Text.fitWidth({
      width,
      reserve: Cli.Fmt.Text.visibleWidth(prefix),
      terminal: false,
    });
    const text = wrangle.clipMiddle(stripAnsi(line.text).trim(), textWidth);
    return `${prefix}${text}`;
  },

  clipMiddleText(text: string, width: number) {
    if (width === 0) return '';
    if (Cli.Fmt.Text.visibleWidth(text) <= width) return text;
    return Str.ellipsize(text, width);
  },

  clipMiddle(text: string, width: number) {
    if (width === 0) return '';
    if (Cli.Fmt.Text.visibleWidth(text) <= width) return text;
    return Str.ellipsize(text, width, { ellipsis: ELLIPSIS_SENTINEL }).replace(
      ELLIPSIS_SENTINEL,
      c.gray('…'),
    );
  },
} as const;
