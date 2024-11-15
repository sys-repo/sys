import { Pkg, VSCode } from './u.json.ts';
import { Markdown } from './u.md.ts';
import { Script } from './u.script.ts';
import { Typescript } from './u.typescript.ts';
import { gitignore } from './u.gitignore.ts';

export const Tmpl = {
  gitignore,
  VSCode,
  Script,
  Typescript,
  Markdown,
  Pkg,
} as const;
