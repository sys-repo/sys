import { Hash, c, Cli, type t } from './common.ts';

/**
 * Outputs a formatted console log within
 * meta-data about the running server and module.
 */
export const print: t.HttpServerLib['print'] = ({ addr, pkg, hash }) => {
  const port = c.bold(c.brightCyan(String(addr.port)));
  const host = c.cyan(`http://localhost:${port}/`);
  if (pkg) {
    pkg.name = pkg.name ?? '<🐷 deno.json:name Not Found 🐷>';
    pkg.version = pkg.version ?? '<🐷 deno.json:version Not Found 🐷>';
    const hx = Hash.Console.digest(hash);
    const integrity = c.gray(`${hx}`);
    const mod = c.bold(pkg.name);
    const version = c.gray(`  ${pkg.version}`);
    const table = Cli.table([]);

    console.trace();
    // console.log('options', options);

    table.push([c.gray('Module'), `${mod}`, version]);
    if (hx) table.push(['', integrity, c.gray(`${c.dim('←')} dist/dist.json`)]);
    table.push(['', host]);
    table.render();
  } else {
    console.info(c.gray(`Listening on ${host}`));
  }
  console.info('');
};
