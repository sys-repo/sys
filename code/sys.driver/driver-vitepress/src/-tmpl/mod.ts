import { Pkg, VSCode } from './u.json.ts';
import { Markdown } from './u.md.ts';
import { Typescript } from './u.typescript.ts';
import { gitignore } from './u.gitignore.ts';

export const Tmpl = {
  gitignore,
  VSCode,
  Typescript,
  Markdown,
  Pkg,
} as const;
