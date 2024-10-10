import { c, type t } from './common.ts';

/**
 * Outputs a formatted console log within
 * meta-data about the running server and module.
 */
export const print: t.HttpServerLib['print'] = (addr, pkg) => {
  const port = c.bold(c.brightCyan(String(addr.port)));
  const host = c.cyan(`http://localhost:${port}/`);
  if (pkg) {
    pkg.name = pkg.name ?? '<🐷 deno.json:name Not Found 🐷>';
    pkg.version = pkg.version ?? '<🐷 deno.json:version Not Found 🐷>';
    console.info();
    console.info(c.gray(`Module   ${c.white(pkg.name)} ${pkg.version}`));
    console.info(c.gray(`         ${host}`));
  } else {
    console.info(c.gray(`Listening on ${host}`));
  }
  console.info('');
};

/**
 * Generates a Deno.server(...) configuration options object.
 */
export const options: t.HttpServerLib['options'] = (port, pkg) => {
  return {
    port,
    onListen: (addr) => print(addr as Deno.NetAddr, pkg),
  };
};
