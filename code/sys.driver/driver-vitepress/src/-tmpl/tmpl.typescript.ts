import { Components } from './tmpl.ts.-components.ts';
import { config, vitepressConfig } from './tmpl.ts.-config.ts';
import { main } from './tmpl.ts.-main.ts';
import { nav } from './tmpl.ts.-nav.ts';

export const Typescript = {
  Components,
  config,
  vitepressConfig,
  nav,
  main,
} as const;
