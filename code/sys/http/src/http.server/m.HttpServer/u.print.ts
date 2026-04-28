import type { HttpServerLib } from './t.ts';

import { Cli, c, Fs, Str } from './common.ts';

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
  const pathEntry = findPathEntry(infoEntries);
  const detailEntries = infoEntries.filter((entry) => entry !== pathEntry);
  const url = formatUrl({ host, path: pathEntry?.[1] });
  const fallback = formatPortFallback({ requestedPort, actualPort: addr.port });

  if (pkg) {
    pkg.name = pkg.name ?? '<🐷 deno.json:name Not Found 🐷>';
    pkg.version = pkg.version ?? '<🐷 deno.json:version Not Found 🐷>';

    const hx = wrangle.hashDigest(hash);
    const integrity = c.gray(`${hx}`);
    const mod = c.bold(pkg.name);
    const version = c.gray(`${pkg.version}`);

    const table = Cli.Table.create([]);
    table.push([c.gray('module:'), `${mod} ${version}`]);
    if (name) table.push([c.gray('serving:'), c.bold(name)]);
    if (servingDir) table.push([c.gray('root:'), c.gray(servingDir)]);
    for (const [label, value] of detailEntries) table.push([c.gray(`${label}:`), c.gray(value)]);
    if (hx) table.push([c.gray('dist:'), `${integrity} ${c.gray(`${c.dim('←')} dist/dist.json`)}`]);
    table.push([c.gray('url:'), url]);
    if (fallback) table.push(['', fallback]);

    console.info('');
    console.info(Str.trimEdgeNewlines(String(table)));
  } else {
    const table = Cli.Table.create([]);
    if (name) table.push([c.gray('serving:'), c.bold(name)]);
    if (servingDir) table.push([c.gray('root:'), c.gray(servingDir)]);
    for (const [label, value] of detailEntries) table.push([c.gray(`${label}:`), c.gray(value)]);
    table.push([c.gray('url:'), url]);
    if (fallback) table.push(['', fallback]);

    console.info('');
    console.info(Str.trimEdgeNewlines(String(table)));
  }
  if (!fallback) console.info('');
};

/**
 * Helpers:
 */
function findPathEntry(infoEntries: readonly (readonly [string, string])[]) {
  return infoEntries.find(([, value]) => value.startsWith('/'));
}

function formatUrl(input: { host: string; path?: string }) {
  return input.path ? `${input.host}${c.gray(`/${Str.trimLeadingSlashes(input.path)}`)}` : `${input.host}${c.gray('/')}`;
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
