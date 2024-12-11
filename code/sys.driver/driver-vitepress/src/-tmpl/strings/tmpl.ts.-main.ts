import { pkg } from './common.ts';

const vitepress = `jsr:${pkg.name}`;

export const main = `
import '${vitepress}/main';
`.slice(1);
