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

  if (name) table.push([formatLabel('service'), formatServiceName(name)]);

  if (pkg) {
    const pkgName = pkg.name ?? '<🐷 deno.json:name Not Found 🐷>';
    const pkgVersion = pkg.version ?? '<🐷 deno.json:version Not Found 🐷>';
    table.push([formatLabel('module'), `${pkgName} ${formatSubtle(`${pkgVersion}`)}`]);
  }
  if (root) table.push([formatLabel('root'), formatSubtle(Fs.trimCwd(root))]);
  for (const detail of details) table.push([formatLabel(detail.label), formatSubtle(detail.value)]);
  if (hx) {
    table.push([
      formatLabel('dist'),
      `${formatSubtle(`${hx}`)} ${formatSubtle('← dist/dist.json')}`,
    ]);
  }
  pushUrls(table, urls);
  if (fallback) table.push(['', fallback]);

  if (wrangle.shouldPrintDivider()) console.info(formatDivider());
  console.info(Str.trimEdgeNewlines(String(table)));
};

/**
 * Helpers:
 */
function infoDetails(info: Record<string, string> | undefined): readonly t.Service.Detail[] {
  return Object.entries(info ?? {}).map(([label, value]) => ({ label, value }));
}

function pushUrls(table: ReturnType<typeof Cli.Table.create>, urls: readonly string[]) {
  urls.forEach((url, index) => table.push([index === 0 ? formatLabel('url') : '', url]));
}

function formatLabel(label: string) {
  return formatSubtle(label);
}

function formatServiceName(name: string) {
  return c.white(name);
}

function formatSubtle(text: string) {
  return c.dim(c.gray(text));
}

function formatDivider() {
  return formatSubtle(Cli.Fmt.hr());
}

const URL_NOTE_INDENT = 17;

function formatPortFallback(input: { requestedPort?: number; actualPort: number }) {
  const { requestedPort, actualPort } = input;
  if (!requestedPort || requestedPort === actualPort) return '';
  const indent = ' '.repeat(URL_NOTE_INDENT);
  return `${indent}${formatSubtle(`${requestedPort} already in use`)}`;
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
