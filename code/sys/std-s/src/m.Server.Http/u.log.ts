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
    const hx = Hash.Console.digest(hash);
    const integrity = c.gray(`${hx}    ← dist/dist.json`);
    const table = Cli.table([]);
    table.push([c.gray('Module'), `${c.white(c.bold(pkg.name))} ${pkg.version}`]);
    if (hx) table.push(['', integrity]);
    table.push(['', host]);
    table.render();
  } else {
    console.info(c.gray(`Listening on ${host}`));
  }
  console.info('');
};
