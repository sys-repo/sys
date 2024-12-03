import { config } from './tmpl.typescript.-config.ts';
import { main } from './tmpl.typescript.-main.ts';
import { nav } from './tmpl.typescript.-nav.ts';
import { pkg } from './tmpl.typescript.-pkg.ts';
import { theme } from './tmpl.typescript.-theme.ts';
import { Components } from './tmpl.typescript.-components.ts';

export const Typescript = {
  pkg,
  nav,
  main,
  config,
  theme,
  Components,
} as const;
