import { config } from './tmpl.typescript.-config.ts';
import { main } from './tmpl.typescript.-main.ts';
import { nav } from './tmpl.typescript.-nav.ts';
import { pkg } from './tmpl.typescript.-pkg.ts';

export const Typescript = {
  pkg,
  nav,
  main,
  config,
} as const;
