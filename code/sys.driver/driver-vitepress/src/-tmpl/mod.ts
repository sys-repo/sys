import { config } from './u.config.ts';
import { Pkg, VSCode } from './u.json.ts';
import { Markdown } from './u.md.ts';
import { pkg } from './u.meta.ts';
import { Script } from './u.script.ts';

const gitignore = `
cache/
dist/
`.slice(1);

export const Tmpl = {
  Script,
  Markdown,
  VSCode,
  Pkg,

  pkg,
  gitignore,
  config,
} as const;
