import { c, Cli, Fs, Str, type t } from '../common.ts';
import { formatPrintUrls } from './u.print.url.ts';

type PrintUrl = ReturnType<typeof formatPrintUrls>[number];

export type PrintDependencies = {
  readonly isTerminal: typeof Cli.Is.terminal;
  readonly screenSize: typeof Cli.Screen.size;
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

  const table = Cli.Table.create([]);

  table.push([
    label(deps, 'service'),
    serviceName(deps, name ?? options.status?.kind ?? 'http', reserve),
  ]);

  if (pkg) {
    const pkgName = pkg.name ?? '<🐷 deno.json:name Not Found 🐷>';
    const pkgVersion = pkg.version ?? '<🐷 deno.json:version Not Found 🐷>';
    table.push([childLabel(deps, 'module'), value(deps, `${pkgName} ${pkgVersion}`, reserve)]);
  }
  pushUrls(deps, table, urls, reserve);
  if (root) table.push([childLabel(deps, 'root'), path(deps, root, reserve)]);
  for (const detail of details) {
    table.push([childLabel(deps, detail.label), value(deps, detail.value, reserve)]);
  }
  if (hx) table.push([childLabel(deps, 'dist'), value(deps, `${hx} ← dist/dist.json`, reserve)]);
  if (fallback) table.push([childLabel(deps, 'port'), value(deps, fallback, reserve)]);
  pushKeyboard(deps, table, options.keyboard, reserve);

  if (wrangle.shouldPrintDivider()) console.info(formatDivider(deps));
  console.info(`\n${Str.trimEdgeNewlines(String(table))}\n`);
}

/**
 * Helpers:
 */
function infoDetails(info: Record<string, string> | undefined): readonly t.Service.Detail[] {
  return Object.entries(info ?? {}).map(([label, value]) => ({ label, value }));
}

function pushUrls(
  deps: PrintDependencies,
  table: ReturnType<typeof Cli.Table.create>,
  urls: readonly PrintUrl[],
  reserve: number,
) {
  urls.forEach((url, index) => {
    table.push([index === 0 ? childLabel(deps, 'url') : '', urlValue(deps, url, reserve)]);
  });
}

function pushKeyboard(
  deps: PrintDependencies,
  table: ReturnType<typeof Cli.Table.create>,
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
  return Cli.Fmt.Path.tty(Fs.trimCwd(input), {
    reserve,
    terminal: deps.isTerminal('stdout'),
    width: deps.screenSize().width,
    highlightBasename: false,
    min: 1,
  });
}

function keyboardValue(deps: PrintDependencies, input: string, reserve: number) {
  return fittedValue(deps, input, reserve, (text) => c.dim(c.gray(text)));
}

function urlValue(
  deps: PrintDependencies,
  part: PrintUrl,
  reserve: number,
) {
  if (
    !deps.isTerminal('stdout') ||
    Cli.Fmt.Text.Width.measure(part.display) <= valueWidth(deps, reserve)
  ) {
    return Cli.Fmt.ServiceUrl.format(part);
  }
  return Cli.Fmt.Text.ellipsize(part.display, valueWidth(deps, reserve), {
    render: ({ head, ellipsis, tail }) => {
      const tailStart = part.display.length - tail.length;
      return `${formatUrlFragment(part, head, 0)}${Cli.Fmt.omission(ellipsis)}${
        formatUrlFragment(part, tail, tailStart)
      }`;
    },
  });
}

function formatUrlFragment(part: PrintUrl, text: string, offset: number) {
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
  if (!deps.isTerminal('stdout')) return color(input);
  const width = labelWidth(deps);
  if (Cli.Fmt.Text.Width.measure(input) <= width) return color(input);
  return Cli.Fmt.Text.ellipsize(input, width, {
    render: ({ head, ellipsis, tail }) => {
      return `${color(head)}${Cli.Fmt.omission(ellipsis)}${color(tail)}`;
    },
  });
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
    render: ({ head, ellipsis, tail }) => {
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
  return Cli.Fmt.Text.Width.max(labels) + Cli.Table.cellGap;
}

function formatDivider(deps: PrintDependencies) {
  const width = deps.isTerminal('stdout') ? deps.screenSize().width : undefined;
  return c.dim(c.gray(width === undefined ? Cli.Fmt.hr() : Cli.Fmt.hr({ width })));
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
