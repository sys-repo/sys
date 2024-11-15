import { denofile } from './u.json.-denofile.ts';
import { pkgJson } from './u.json.-package.ts';
export { VSCode } from './u.json.-vscode.ts';

export const Pkg = {
  denofile,
  package: pkgJson,
} as const;
