import { c, Cli, Path, Str, type t } from '../common.host.ts';
import { formatPrintUrls } from './u.print.url.ts';

type PrintDependencies = {
  readonly isTerminal: t.Cli.Is.Lib['terminal'];
  readonly screenSize: t.Cli.Screen.Lib['size'];
};

const DEFAULT_DEPS: PrintDependencies = {
  isTerminal: Cli.Is.terminal,
  screenSize: Cli.Screen.size,
};

/**
 * Outputs HTTP-owner startup information for direct server use.
 */
export const print: t.HttpServer.Lib['print'] = (options) => printWithOrigin(options);

/** Internal startup-output path for an already settled listener origin. */
export function printWithOrigin(
  options: t.HttpServer.Print.Options,
  settledOrigin?: t.StringUrl,
) {
  printWith(DEFAULT_DEPS, options, settledOrigin);
}

/** Package-internal terminal dependency seam. */
export function printWith(
  deps: PrintDependencies,
  options: t.HttpServer.Print.Options,
  settledOrigin?: t.StringUrl,
) {
  const { addr, pkg, hash, name, requestedPort } = options;
  const root = options.status?.root ?? options.dir;
  const details = options.status?.details ?? infoDetails(options.info);
  const urls = formatPrintUrls({ addr, paths: options.status?.urlPaths, settledOrigin });
  const fallback = formatPortFallback({ requestedPort, actualPort: addr.port });
  const hx = pkg ? wrangle.hashDigest(hash) : '';
  const reserve = tableValueReserve(deps, {
    pkg: pkg !== undefined,
    urls: urls.length > 0,
    details,
    dist: Boolean(hx),
    port: Boolean(fallback),
    keyboard: options.keyboard,
  });

  const table: t.Cli.Table.Pair[] = [];

  table.push([
    label(deps, 'service'),
    serviceName(deps, name ?? options.status?.kind ?? 'http', reserve),
  ]);

  if (pkg) {
    const pkgName = pkg.name ?? '<🐷 deno.json:name Not Found 🐷>';
    const pkgVersion = pkg.version ?? '<🐷 deno.json:version Not Found 🐷>';
    table.push([childLabel(deps, 'module'), value(deps, `${pkgName} ${pkgVersion}`, reserve)]);
  }
  for (const detail of details) {
    table.push([
      childLabel(deps, detail.label),
      detailValue(deps, detail, reserve, options.formatDetail),
    ]);
  }
  pushUrls(deps, table, urls, reserve);
  if (root) table.push([childLabel(deps, 'root'), path(deps, root, reserve)]);
  if (hx) table.push([childLabel(deps, 'dist'), value(deps, `${hx} ← dist/dist.json`, reserve)]);
  if (fallback) table.push([childLabel(deps, 'port'), value(deps, fallback, reserve)]);
  pushKeyboard(deps, table, options.keyboard, reserve);

  const output = Cli.Table.pairs(table, reserve);
  if (wrangle.shouldPrintDivider()) console.info(formatDivider(deps));
  console.info(`\n${Str.trimEdgeNewlines(output)}\n`);
}

/**
 * Helpers:
 */
function infoDetails(info: Record<string, string> | undefined): readonly t.Service.Detail[] {
  return Object.entries(info ?? {}).map(([label, value]) => ({ label, value }));
}

function detailValue(
  deps: PrintDependencies,
  detail: t.Service.Detail,
  reserve: number,
  format?: t.HttpServer.Print.FormatDetail,
) {
  const maxWidth = deps.isTerminal('stdout') ? valueWidth(deps, reserve) : undefined;
  const formatted = format?.({ detail, maxWidth });
  if (formatted !== undefined) {
    if (maxWidth === undefined) return formatted;
    const lines = formatted.split('\n');
    const fits = lines.every((line) => Cli.Fmt.Text.Width.measure(line) <= maxWidth);
    if (fits) return formatted;
  }

  return detail.value.split('\n').map((line) => value(deps, line, reserve)).join('\n');
}

function pushUrls(
  deps: PrintDependencies,
  table: t.Cli.Table.Pair[],
  urls: readonly t.Cli.Fmt.ServiceUrl.Part[],
  reserve: number,
) {
  urls.forEach((url, index) => {
    table.push([index === 0 ? childLabel(deps, 'url') : '', urlValue(deps, url, reserve)]);
  });
}

function pushKeyboard(
  deps: PrintDependencies,
  table: t.Cli.Table.Pair[],
  keyboard: t.HttpServer.Print.Keyboard.Options | undefined,
  reserve: number,
) {
  if (keyboard?.open) {
    table.push([keyboardLabel(deps, 'open'), keyboardValue(deps, keyboard.open, reserve)]);
  }
  if (keyboard?.quit) {
    table.push([keyboardLabel(deps, 'quit'), keyboardValue(deps, keyboard.quit, reserve)]);
  }
}

function label(deps: PrintDependencies, input: string) {
  return fittedLabel(deps, input, c.gray);
}

function childLabel(deps: PrintDependencies, input: string) {
  return label(deps, `  ${input}`);
}

function keyboardLabel(deps: PrintDependencies, input: string) {
  return fittedLabel(deps, `  ${input}`, (text) => c.dim(c.gray(text)));
}

function serviceName(deps: PrintDependencies, input: string, reserve: number) {
  return fittedValue(deps, input, reserve, c.white);
}

function value(deps: PrintDependencies, input: string, reserve: number) {
  return fittedValue(deps, input, reserve, c.gray);
}

function path(deps: PrintDependencies, input: string, reserve: number) {
  if (deps.isTerminal('stdout') && valueWidth(deps, reserve) === 0) return '';
  return Cli.Fmt.Path.tty(trimCwd(input), {
    reserve,
    terminal: deps.isTerminal('stdout'),
    width: deps.screenSize().width,
    highlightBasename: false,
    min: 1,
  });
}

function trimCwd(input: string): string {
  if (Path.Is.relative(input)) return input.replace(/^\.\//, '');
  const cwd = Deno.cwd();
  const prefix = cwd.endsWith('/') ? cwd : `${cwd}/`;
  if (input === cwd) return '';
  return input.startsWith(prefix) ? input.slice(prefix.length) : input;
}

function keyboardValue(deps: PrintDependencies, input: string, reserve: number) {
  return fittedValue(deps, input, reserve, (text) => c.dim(c.gray(text)));
}

function urlValue(
  deps: PrintDependencies,
  part: t.Cli.Fmt.ServiceUrl.Part,
  reserve: number,
) {
  if (!deps.isTerminal('stdout')) return Cli.Fmt.ServiceUrl.format(part);
  const width = valueWidth(deps, reserve);
  if (Cli.Fmt.Text.Width.measure(part.display) <= width) return Cli.Fmt.ServiceUrl.format(part);

  return Cli.Fmt.Text.ellipsize(part.display, width, {
    render({ head, ellipsis, tail }) {
      const tailStart = part.display.length - tail.length;
      const headText = formatUrlFragment(part, head, 0);
      const omission = Cli.Fmt.omission(ellipsis);
      const tailText = formatUrlFragment(part, tail, tailStart);
      return `${headText}${omission}${tailText}`;
    },
  });
}

function formatUrlFragment(part: t.Cli.Fmt.ServiceUrl.Part, text: string, offset: number) {
  const originEnd = part.origin.length;
  const portStart = part.port ? originEnd - part.port.length : originEnd;
  const origin = part.highlightOrigin ? c.cyan : c.gray;
  const port = part.highlightOrigin ? (value: string) => c.bold(c.cyan(value)) : c.gray;
  const suffix = part.highlightOrigin && part.suffix === '/' ? c.cyan : c.gray;
  return [
    formatUrlRange(text, offset, 0, portStart, origin),
    formatUrlRange(text, offset, portStart, originEnd, port),
    formatUrlRange(text, offset, originEnd, part.display.length, suffix),
  ].join('');
}

function formatUrlRange(
  text: string,
  offset: number,
  start: number,
  end: number,
  color: (value: string) => string,
) {
  const from = Math.max(offset, start);
  const to = Math.min(offset + text.length, end);
  return from >= to ? '' : color(text.slice(from - offset, to - offset));
}

function fittedLabel(
  deps: PrintDependencies,
  input: string,
  color: (text: string) => string,
) {
  const width = deps.isTerminal('stdout') ? labelWidth(deps) : undefined;
  return input.split('\n').map((line) => {
    if (width === undefined || Cli.Fmt.Text.Width.measure(line) <= width) return color(line);
    return Cli.Fmt.Text.ellipsize(line, width, {
      render: ({ head, ellipsis, tail }) => {
        return `${color(head)}${Cli.Fmt.omission(ellipsis)}${color(tail)}`;
      },
    });
  }).join('\n');
}

function fittedValue(
  deps: PrintDependencies,
  input: string,
  reserve: number,
  color: (text: string) => string,
) {
  if (!deps.isTerminal('stdout')) return color(input);
  const width = valueWidth(deps, reserve);
  if (Cli.Fmt.Text.Width.measure(input) <= width) return color(input);
  return Cli.Fmt.Text.ellipsize(input, width, {
    render({ head, ellipsis, tail }) {
      return `${color(head)}${Cli.Fmt.omission(ellipsis)}${color(tail)}`;
    },
  });
}

function labelWidth(deps: PrintDependencies) {
  const width = deps.screenSize().width;
  return width > Cli.Table.cellGap ? Math.floor((width - Cli.Table.cellGap) / 2) : 0;
}

function valueWidth(deps: PrintDependencies, reserve: number) {
  const width = deps.screenSize().width;
  return width > 0 ? Math.max(0, width - reserve) : 0;
}

function tableValueReserve(deps: PrintDependencies, input: {
  readonly pkg: boolean;
  readonly urls: boolean;
  readonly details: readonly t.Service.Detail[];
  readonly dist: boolean;
  readonly port: boolean;
  readonly keyboard: t.HttpServer.Print.Keyboard.Options | undefined;
}) {
  const labels = [label(deps, 'service'), childLabel(deps, 'root')];
  if (input.pkg) labels.push(childLabel(deps, 'module'));
  if (input.urls) labels.push(childLabel(deps, 'url'));
  for (const detail of input.details) labels.push(childLabel(deps, detail.label));
  if (input.dist) labels.push(childLabel(deps, 'dist'));
  if (input.port) labels.push(childLabel(deps, 'port'));
  if (input.keyboard?.open) labels.push(keyboardLabel(deps, 'open'));
  if (input.keyboard?.quit) labels.push(keyboardLabel(deps, 'quit'));
  const lines = labels.flatMap((label) => label.split('\n'));
  return Cli.Fmt.Text.Width.max(lines) + Cli.Table.cellGap;
}

function formatDivider(deps: PrintDependencies) {
  const width = deps.isTerminal('stdout') ? deps.screenSize().width : undefined;
  const rule = width === undefined ? Cli.Fmt.hr() : Cli.Fmt.hr({ width });
  return c.dim(c.gray(rule));
}

function formatPortFallback(input: { requestedPort?: number; actualPort: number }) {
  const { requestedPort, actualPort } = input;
  if (!requestedPort || requestedPort === actualPort) return '';
  return `${requestedPort} already in use; using ${actualPort}`;
}

let printSink: typeof console.info | undefined;
let hasPrintedToSink = false;

const wrangle = {
  shouldPrintDivider() {
    const sink = console.info;
    if (sink !== printSink) {
      printSink = sink;
      hasPrintedToSink = false;
    }

    const shouldPrint = hasPrintedToSink;
    hasPrintedToSink = true;
    return shouldPrint;
  },

  hashDigest(hash?: string) {
    if (!hash) return '';
    if (hash.length <= 18) return hash;
    return `${hash.slice(0, 12)}…${hash.slice(-6)}`;
  },
} as const;
