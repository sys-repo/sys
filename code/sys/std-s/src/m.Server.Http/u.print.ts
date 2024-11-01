import { Hash, c, type t } from './common.ts';

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
    const mod = `${c.white(c.bold(pkg.name))} ${pkg.version}`;

    console.info();
    console.info(c.gray(`Module   ${mod}`));
    if (hx) console.info(c.gray(`         ${hx.uri}`));
    console.info(c.gray(`         ${host}`));
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
    const short = Hash.shorten(hash, [5, 5], { trimPrefix: true });
    const uri = hash ? `pkg:${algo}:${c.green(short)}` : '';
    return { short, uri };
  },
} as const;
