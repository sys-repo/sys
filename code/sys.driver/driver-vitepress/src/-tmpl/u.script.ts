import { pkg, Pkg } from '../common.ts';

const vitepress = `jsr:${pkg.name}`;

const main = `
import '${vitepress}/main';
`.slice(1);

export const Script = { main } as const;
