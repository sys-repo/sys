import { Pkg, VSCode } from './u.json.ts';
import { Markdown } from './u.md.ts';
import { Script } from './u.script.ts';
import { Typescript } from './u.typescript.ts';

const gitignore = `
cache/
dist/
`.slice(1);

export const Tmpl = {
  VSCode,
  Script,
  Typescript,
  Markdown,
  Pkg,
  gitignore,
} as const;
