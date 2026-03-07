import { type t, c, Cli, Fs, HashFmt } from './common.ts';

/**
 * Outputs a formatted console log within
 * meta-data about the running server and module.
 */
export const print: t.HttpServerLib['print'] = (options) => {
  const { addr, pkg, hash, requestedPort } = options;
  const port = c.bold(c.brightCyan(String(addr.port)));

  const formattedDir = wrangle.formattedDir(options.dir);
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

    if (formattedDir) {
      table.push(['', c.gray(`${formattedDir}/`)]);
    }
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

/**
 * Helpers:
 */
const wrangle = {
  formattedDir(dir?: string) {
    const normalizedDir = dir ? Fs.Path.normalize(dir) : '';
    if (!normalizedDir) return '';

    const terminalDir = Fs.Path.normalize(Fs.cwd('terminal'));
    const processDir = Fs.Path.normalize(Fs.cwd('process'));
    const relative =
      wrangle.relativeSegment(terminalDir, normalizedDir) ||
      wrangle.relativeSegment(processDir, normalizedDir);

    if (relative) return `./${relative}`;
    return normalizedDir.replace(/^\/+|\/+$/g, '');
  },

  relativeSegment(base: string, target: string) {
    if (!target || target === base) return '';
    const candidate = Fs.Path.relative(base, target);
    if (!candidate || candidate.startsWith('..')) return '';
    return candidate.replace(/^\/+|\/+$/g, '');
  },
} as const;
