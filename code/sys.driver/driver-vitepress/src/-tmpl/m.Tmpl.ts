import { gitignore } from './tmpl.gitignore.ts';
import { Pkg, VSCode } from './tmpl.json.ts';
import { Docs } from './tmpl.docs.ts';
import { Typescript } from './tmpl.typescript.ts';

export const Tmpl = {
  gitignore,
  VSCode,
  Typescript,
  Docs,
  Pkg,
} as const;
