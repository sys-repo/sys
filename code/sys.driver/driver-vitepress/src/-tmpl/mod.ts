import { Pkg, VSCode } from './u.json.ts';
import { Markdown } from './u.md.ts';
import { Script } from './u.script.ts';
import { Typescript } from './u.typescript.ts';
import { gitignore } from './u.gitignore.ts';

export const Tmpl = {
  VSCode,
  Script,
  Typescript,
  Markdown,
  Pkg,
  gitignore,
} as const;
