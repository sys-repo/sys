import type { HttpServerLib } from './t.ts';

import { c, Cli, Fs, Str, type t } from './common.ts';
import { formatPrintUrls } from './u.print.url.ts';

/**
 * Outputs HTTP-owner startup information for direct server use.
 */
export const print: HttpServerLib['print'] = (options) => {
  const { addr, pkg, hash, name, requestedPort } = options;
  const root = options.status?.root ?? options.dir;
  const details = options.status?.details ?? infoDetails(options.info);
  const urls = formatPrintUrls({ addr, paths: options.status?.urlPaths });
  const fallback = formatPortFallback({ requestedPort, actualPort: addr.port });

  const table = Cli.Table.create([]);
  const hx = pkg ? wrangle.hashDigest(hash) : '';

  table.push([label('service'), serviceName(name ?? options.status?.kind ?? 'http')]);

  if (pkg) {
    const pkgName = pkg.name ?? '<🐷 deno.json:name Not Found 🐷>';
    const pkgVersion = pkg.version ?? '<🐷 deno.json:version Not Found 🐷>';
    table.push([childLabel('module'), value(`${pkgName} ${pkgVersion}`)]);
  }
  pushUrls(table, urls);
  if (root) table.push([childLabel('root'), path(root)]);
  for (const detail of details) table.push([childLabel(detail.label), value(detail.value)]);
  if (hx) table.push([childLabel('dist'), value(`${hx} ← dist/dist.json`)]);
  if (fallback) table.push([childLabel('port'), value(fallback)]);
  pushKeyboard(table, options.keyboard);

  if (wrangle.shouldPrintDivider()) console.info(formatDivider());
  console.info(`\n${Str.trimEdgeNewlines(String(table))}\n`);
};

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
  keyboard: t.HttpServerPrintKeyboardOptions | undefined,
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

function path(input: string) {
  return value(Fs.trimCwd(input));
}

function keyboardValue(input: string) {
  return c.dim(c.gray(input));
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
