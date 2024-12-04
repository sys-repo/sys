import { Components } from './tmpl.ts.-components.ts';
import { config } from './tmpl.ts.-config.ts';
import { main } from './tmpl.ts.-main.ts';
import { nav } from './tmpl.ts.-nav.ts';
import { pkg } from './tmpl.ts.-pkg.ts';
import { theme } from './tmpl.ts.-theme.ts';

export const Typescript = {
  Components,
  config,
  pkg,
  nav,
  main,
  theme,
} as const;
