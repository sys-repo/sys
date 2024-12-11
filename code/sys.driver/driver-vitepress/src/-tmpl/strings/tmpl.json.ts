import { denofile } from './tmpl.json.-denofile.ts';
import { pkgJson } from './tmpl.json.-package.ts';
export { VSCode } from './tmpl.json.-vscode.ts';

export const Pkg = {
  denofile,
  package: pkgJson,
} as const;
