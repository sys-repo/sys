import { Hash, c, Cli, type t } from './common.ts';

/**
 * Outputs a formatted console log within
 * meta-data about the running server and module.
 */
export const print: t.HttpServerLib['print'] = (addr, pkg, hash) => {
  const port = c.bold(c.brightCyan(String(addr.port)));
  const host = c.cyan(`http://localhost:${port}/`);
  if (pkg) {
    pkg.name = pkg.name ?? '<🐷 deno.json:name Not Found 🐷>';
    pkg.version = pkg.version ?? '<🐷 deno.json:version Not Found 🐷>';
    const hx = wrangle.hx(hash);
    const table = Cli.table([]);
    table.push([c.gray('Module'), `${c.white(c.bold(pkg.name))} ${pkg.version}`]);
    if (hx) table.push(['', hx.uri]);
    table.push(['', host]);
    table.render();
  } else {
    console.info(c.gray(`Listening on ${host}`));
  }
  console.info('');
};

/**
 * Helpers
 */
const wrangle = {
  hx(hash?: t.StringHash) {
    if (!hash) return;
    const algo = Hash.prefix(hash);
    const short = Hash.shorten(hash, [5, 5], true);
    let uri = `${c.green('digest')}:${algo}:${short}`;
    uri = c.gray(`${uri.slice(0, -5)}${c.green(uri.slice(-5))}`);
    return { short, uri };
  },
} as const;
