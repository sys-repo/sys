import { Docs } from './tmpl.docs.ts';
import { gitignore } from './tmpl.gitignore.ts';
import { Pkg, VSCode } from './tmpl.json.ts';
import { Typescript } from './tmpl.typescript.ts';
import { Theme } from './tmpl.theme.ts';

export const Tmpl = {
  gitignore,
  VSCode,
  Typescript,
  Docs,
  Theme,
  Pkg,
} as const;
