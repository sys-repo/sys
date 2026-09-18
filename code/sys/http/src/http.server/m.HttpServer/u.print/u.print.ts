import { c, Cli, Path, Str, type t } from '../common.host.ts';
import {
  fittedLabel,
  fittedValue,
  labelReserve,
  labelWidth,
  valueWidth,
} from './u.print.layout.ts';
import { formatPrintUrls, urlValue } from './u.print.url.ts';

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
  const maxWidth = terminalValueWidth(deps, reserve);
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
    const title = index === 0 ? childLabel(deps, 'url') : '';
    const width = terminalValueWidth(deps, reserve);
    table.push([title, urlValue(url, width)]);
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

function label(deps: PrintDependencies, input: string, color = c.gray) {
  const width = deps.isTerminal('stdout') ? labelWidth(deps.screenSize().width) : undefined;
  return fittedLabel(input, width, color);
}

function childLabel(deps: PrintDependencies, input: string) {
  return label(deps, `  ${input}`);
}

function keyboardLabel(deps: PrintDependencies, input: string) {
  return label(deps, `  ${input}`, (text) => c.dim(c.gray(text)));
}

function serviceName(deps: PrintDependencies, input: string, reserve: number) {
  return value(deps, input, reserve, c.white);
}

function value(deps: PrintDependencies, input: string, reserve: number, color = c.gray) {
  return fittedValue(input, terminalValueWidth(deps, reserve), color);
}

function path(deps: PrintDependencies, input: string, reserve: number) {
  if (deps.isTerminal('stdout') && valueWidth(deps.screenSize().width, reserve) === 0) return '';
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
  return value(deps, input, reserve, (text) => c.dim(c.gray(text)));
}

function terminalValueWidth(deps: PrintDependencies, reserve: number) {
  if (!deps.isTerminal('stdout')) return undefined;
  return valueWidth(deps.screenSize().width, reserve);
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
  return labelReserve(labels);
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
