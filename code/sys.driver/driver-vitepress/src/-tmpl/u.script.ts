import { pkg, Pkg } from '../common.ts';

const vitepress = `jsr:${Pkg.toString(pkg)}`;

const main = `
import '${vitepress}/main';
`.slice(1);

export const Script = { main } as const;
