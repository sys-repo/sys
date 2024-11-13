import { main } from './tmpl.script.main.ts';
import { config } from './tmpl.config.ts';
import { denofile } from './tmpl.deno.json.ts';
import { pkg } from './tmpl.pkg.ts';
import { index } from './tmpl.index.md.ts';

const gitignore = `
cache/
dist/
`.slice(1);

export const Tmpl = {
  Script: { main },
  Markdown: { index },
  pkg,
  gitignore,
  config,
  denofile,
};
