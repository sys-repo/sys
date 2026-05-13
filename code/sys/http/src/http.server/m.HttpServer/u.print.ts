import type { HttpServerLib } from './t.ts';

import { c, Cli, Fs, Str } from './common.ts';

/**
 * Outputs a formatted console log within
 * meta-data about the running server and module.
 */
export const print: HttpServerLib['print'] = (options) => {
  const { addr, pkg, hash, name, info, requestedPort } = options;
  const port = c.bold(c.brightCyan(String(addr.port)));

  const servingDir = options.dir ? Fs.trimCwd(options.dir) : '';
  const host = c.cyan(`http://localhost:${port}`);
  const repeatedHost = formatSubtle(`http://localhost:${addr.port}`);
  const infoEntries = Object.entries(info ?? {});
  const pathEntries = findPathEntries(infoEntries);
  const detailEntries = infoEntries.filter((entry) => !pathEntries.includes(entry));
  const urls = formatUrls({ host, repeatedHost, paths: pathEntries.map(([, path]) => path) });
  const fallback = formatPortFallback({ requestedPort, actualPort: addr.port });

  const table = Cli.Table.create([]);
  const hx = pkg ? wrangle.hashDigest(hash) : '';

  if (name) table.push([formatLabel('service'), formatServiceName(name)]);

  if (pkg) {
    const pkgName = pkg.name ?? '<🐷 deno.json:name Not Found 🐷>';
    const pkgVersion = pkg.version ?? '<🐷 deno.json:version Not Found 🐷>';
    table.push([formatLabel('module'), `${pkgName} ${formatSubtle(`${pkgVersion}`)}`]);
  }
  if (servingDir) table.push([formatLabel('root'), formatSubtle(servingDir)]);
  for (const [label, value] of detailEntries) table.push([formatLabel(label), formatSubtle(value)]);
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
function findPathEntries(infoEntries: readonly (readonly [string, string])[]) {
  return infoEntries.filter(([, value]) => value.startsWith('/'));
}

function pushUrls(table: ReturnType<typeof Cli.Table.create>, urls: string[]) {
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

function formatUrls(input: {
  readonly host: string;
  readonly repeatedHost: string;
  readonly paths: readonly string[];
}) {
  if (input.paths.length === 0) return [formatUrl({ host: input.host })];
  return input.paths.map((path, index) => {
    const host = index === 0 ? input.host : input.repeatedHost;
    return formatUrl({ host, path });
  });
}

function formatUrl(input: { host: string; path?: string }) {
  return input.path
    ? `${input.host}${formatSubtle(`/${Str.trimLeadingSlashes(input.path)}`)}`
    : `${input.host}${formatSubtle('/')}`;
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
