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
  const infoEntries = Object.entries(info ?? {});
  const pathEntries = findPathEntries(infoEntries);
  const detailEntries = infoEntries.filter((entry) => !pathEntries.includes(entry));
  const pathUrls = pathEntries.map(([, path]) => formatUrl({ host, path }));
  const urls = pathUrls.length > 0 ? pathUrls : [formatUrl({ host })];
  const fallback = formatPortFallback({ requestedPort, actualPort: addr.port });

  const table = Cli.Table.create([]);
  const hx = pkg ? wrangle.hashDigest(hash) : '';

  if (pkg) {
    pkg.name = pkg.name ?? '<🐷 deno.json:name Not Found 🐷>';
    pkg.version = pkg.version ?? '<🐷 deno.json:version Not Found 🐷>';
    table.push([c.gray('module:'), `${c.bold(pkg.name)} ${c.gray(`${pkg.version}`)}`]);
  }

  if (name) table.push([c.gray('service:'), c.bold(name)]);
  if (servingDir) table.push([c.gray('root:'), c.gray(servingDir)]);
  for (const [label, value] of detailEntries) table.push([c.gray(`${label}:`), c.gray(value)]);
  if (hx) {
    table.push([c.gray('dist:'), `${c.gray(`${hx}`)} ${c.gray(`${c.dim('←')} dist/dist.json`)}`]);
  }
  pushUrls(table, urls);
  if (fallback) table.push(['', fallback]);

  wrangle.printBlock(table);
};

/**
 * Helpers:
 */
function findPathEntries(infoEntries: readonly (readonly [string, string])[]) {
  return infoEntries.filter(([, value]) => value.startsWith('/'));
}

function pushUrls(table: ReturnType<typeof Cli.Table.create>, urls: string[]) {
  urls.forEach((url, index) => table.push([index === 0 ? c.gray('url:') : '', url]));
}

function formatUrl(input: { host: string; path?: string }) {
  return input.path
    ? `${input.host}${c.gray(`/${Str.trimLeadingSlashes(input.path)}`)}`
    : `${input.host}${c.gray('/')}`;
}

const URL_NOTE_INDENT = 17;

function formatPortFallback(input: { requestedPort?: number; actualPort: number }) {
  const { requestedPort, actualPort } = input;
  if (!requestedPort || requestedPort === actualPort) return '';
  const indent = ' '.repeat(URL_NOTE_INDENT);
  return `${indent}${c.gray(c.dim(`${requestedPort} already in use`))}`;
}

const wrangle = {
  printBlock(table: ReturnType<typeof Cli.Table.create>) {
    console.info('');
    console.info(Str.trimEdgeNewlines(String(table)));
  },

  hashDigest(hash?: string) {
    if (!hash) return '';
    if (hash.length <= 18) return hash;
    return `${hash.slice(0, 12)}…${hash.slice(-6)}`;
  },
} as const;
