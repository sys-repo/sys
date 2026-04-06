import type { HttpServerLib } from './t.ts';

import { c } from '@sys/color/ansi';
import { Fs } from '@sys/fs';

/**
 * Outputs a formatted console log within
 * meta-data about the running server and module.
 */
export const print: HttpServerLib['print'] = (options) => {
  const { addr, pkg, hash, requestedPort } = options;
  const port = c.bold(c.brightCyan(String(addr.port)));

  const formattedDir = wrangle.formattedDir(options.dir);
  const host = c.cyan(`http://localhost:${port}/`);

  if (pkg) {
    pkg.name = pkg.name ?? '<🐷 deno.json:name Not Found 🐷>';
    pkg.version = pkg.version ?? '<🐷 deno.json:version Not Found 🐷>';

    const hx = wrangle.hashDigest(hash);
    const integrity = c.gray(`${hx}`);
    const mod = c.bold(pkg.name);
    const version = c.gray(`${pkg.version}`);

    const lines = [ `${c.gray('Module:')} ${mod} ${version}` ];
    if (formattedDir) lines.push(`        ${c.gray(`${formattedDir}/`)}`);
    if (hx) lines.push(`        ${integrity} ${c.gray(`${c.dim('←')} dist/dist.json`)}`);
    if (requestedPort && requestedPort !== addr.port) {
      lines.push(`        ${host} ${c.gray(`${c.dim('←')} port ${requestedPort} already in use`)}`);
    } else {
      lines.push(`        ${host}`);
    }

    console.info('');
    console.info(lines.join('\n'));
  } else {
    console.info('');
    console.info(c.gray(`Listening on ${host}`));
  }
  console.info('');
};

/**
 * Helpers:
 */
const wrangle = {
  hashDigest(hash?: string) {
    if (!hash) return '';
    if (hash.length <= 18) return hash;
    return `${hash.slice(0, 12)}…${hash.slice(-6)}`;
  },

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
