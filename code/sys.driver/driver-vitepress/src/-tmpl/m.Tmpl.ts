import { gitignore } from './tmpl.gitignore.ts';
import { Pkg, VSCode } from './tmpl.json.ts';
import { Markdown } from './tmpl.md.ts';
import { Typescript } from './tmpl.typescript.ts';

export const Tmpl = {
  gitignore,
  VSCode,
  Typescript,
  Markdown,
  Pkg,
} as const;
