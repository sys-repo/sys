import { type t, c, Cli, HashFmt } from './common.ts';

/**
 * Outputs a formatted console log within
 * meta-data about the running server and module.
 */
export const print: t.HttpServerLib['print'] = (options) => {
  const { addr, pkg, hash, requestedPort } = options;
  const port = c.bold(c.brightCyan(String(addr.port)));
  const host = c.cyan(`http://localhost:${port}/`);
  if (pkg) {
    pkg.name = pkg.name ?? '<🐷 deno.json:name Not Found 🐷>';
    pkg.version = pkg.version ?? '<🐷 deno.json:version Not Found 🐷>';

    const hx = HashFmt.digest(hash);
    const integrity = c.gray(`${hx}`);
    const mod = c.bold(pkg.name);
    const version = c.gray(`${pkg.version}`);

    const table = Cli.table([]);
    table.push([c.gray('Module:'), `${mod} ${version}`]);

    if (hx) table.push(['', integrity, c.gray(`${c.dim('←')} dist/dist.json`)]);
    if (requestedPort && requestedPort !== addr.port) {
      table.push(['', host, c.gray(`${c.dim('←')} port ${requestedPort} already in use`)]);
    } else {
      table.push(['', host]);
    }
    console.info(table.toString().trim());
  } else {
    console.info(c.gray(`Listening on ${host}`));
  }
  console.info('');
};
