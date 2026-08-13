import { c, Cli, Fs, Str, type t } from '../common.ts';
import { formatPrintUrls } from './u.print.url.ts';

/**
 * Outputs HTTP-owner startup information for direct server use.
 */
export const print: t.HttpServer.Lib['print'] = (options) => printWithOrigin(options);

/** Internal startup-output path for an already settled listener origin. */
export function printWithOrigin(options: t.HttpServer.Print.Options, settledOrigin?: t.StringUrl) {
  const { addr, pkg, hash, name, requestedPort } = options;
  const root = options.status?.root ?? options.dir;
  const details = options.status?.details ?? infoDetails(options.info);
  const urls = formatPrintUrls({ addr, paths: options.status?.urlPaths, settledOrigin });
  const fallback = formatPortFallback({ requestedPort, actualPort: addr.port });
  const hx = pkg ? wrangle.hashDigest(hash) : '';
  const rootReserve = root
    ? tableValueReserve({
      pkg: pkg !== undefined,
      urls: urls.length > 0,
      details,
      dist: Boolean(hx),
      port: Boolean(fallback),
      keyboard: options.keyboard,
    })
    : 0;

  const table = Cli.Table.create([]);

  table.push([label('service'), serviceName(name ?? options.status?.kind ?? 'http')]);

  if (pkg) {
    const pkgName = pkg.name ?? '<🐷 deno.json:name Not Found 🐷>';
    const pkgVersion = pkg.version ?? '<🐷 deno.json:version Not Found 🐷>';
    table.push([childLabel('module'), value(`${pkgName} ${pkgVersion}`)]);
  }
  pushUrls(table, urls);
  if (root) table.push([childLabel('root'), path(root, rootReserve)]);
  for (const detail of details) table.push([childLabel(detail.label), value(detail.value)]);
  if (hx) table.push([childLabel('dist'), value(`${hx} ← dist/dist.json`)]);
  if (fallback) table.push([childLabel('port'), value(fallback)]);
  pushKeyboard(table, options.keyboard);

  if (wrangle.shouldPrintDivider()) console.info(formatDivider());
  console.info(`\n${Str.trimEdgeNewlines(String(table))}\n`);
}

/**
 * Helpers:
 */
function infoDetails(info: Record<string, string> | undefined): readonly t.Service.Detail[] {
  return Object.entries(info ?? {}).map(([label, value]) => ({ label, value }));
}

function pushUrls(table: ReturnType<typeof Cli.Table.create>, urls: readonly string[]) {
  urls.forEach((url, index) => table.push([index === 0 ? childLabel('url') : '', url]));
}

function pushKeyboard(
  table: ReturnType<typeof Cli.Table.create>,
  keyboard: t.HttpServer.Print.Keyboard.Options | undefined,
) {
  if (keyboard?.open) table.push([keyboardLabel('open'), keyboardValue(keyboard.open)]);
  if (keyboard?.quit) table.push([keyboardLabel('quit'), keyboardValue(keyboard.quit)]);
}

function label(input: string) {
  return c.gray(input);
}

function childLabel(input: string) {
  return label(`  ${input}`);
}

function keyboardLabel(input: string) {
  return c.dim(c.gray(`  ${input}`));
}

function serviceName(name: string) {
  return c.white(name);
}

function value(input: string) {
  return c.gray(input);
}

function path(input: string, reserve: number) {
  return Cli.Fmt.Path.tty(Fs.trimCwd(input), {
    reserve,
    terminal: Cli.Is.terminal('stdout'),
    width: Cli.Screen.size().width,
    highlightBasename: false,
    min: 1,
  });
}

function keyboardValue(input: string) {
  return c.dim(c.gray(input));
}

function tableValueReserve(input: {
  readonly pkg: boolean;
  readonly urls: boolean;
  readonly details: readonly t.Service.Detail[];
  readonly dist: boolean;
  readonly port: boolean;
  readonly keyboard: t.HttpServer.Print.Keyboard.Options | undefined;
}) {
  const labels = [label('service'), childLabel('root')];
  if (input.pkg) labels.push(childLabel('module'));
  if (input.urls) labels.push(childLabel('url'));
  for (const detail of input.details) labels.push(childLabel(detail.label));
  if (input.dist) labels.push(childLabel('dist'));
  if (input.port) labels.push(childLabel('port'));
  if (input.keyboard?.open) labels.push(keyboardLabel('open'));
  if (input.keyboard?.quit) labels.push(keyboardLabel('quit'));
  return Cli.Fmt.Text.Width.max(labels) + Cli.Table.cellGap;
}

function formatDivider() {
  return c.dim(c.gray(Cli.Fmt.hr()));
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
