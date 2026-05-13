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
  const repeatedHost = c.gray(`http://localhost:${addr.port}`);
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
    table.push([formatLabel('module'), `${pkgName} ${c.gray(`${pkgVersion}`)}`]);
  }
  if (servingDir) table.push([formatLabel('root'), c.gray(servingDir)]);
  for (const [label, value] of detailEntries) table.push([formatLabel(label), c.gray(value)]);
  if (hx) {
    table.push([formatLabel('dist'), `${c.gray(`${hx}`)} ${c.gray(`${c.dim('←')} dist/dist.json`)}`]);
  }
  pushUrls(table, urls);
  if (fallback) table.push(['', fallback]);

  console.info(c.dim(c.gray(Cli.Fmt.hr())));
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
  return c.gray(label);
}

function formatServiceName(name: string) {
  return c.white(name);
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
  hashDigest(hash?: string) {
    if (!hash) return '';
    if (hash.length <= 18) return hash;
    return `${hash.slice(0, 12)}…${hash.slice(-6)}`;
  },
} as const;
