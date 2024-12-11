import { Components } from './tmpl.ts.-components.ts';
import { markdownConfig, userConfig, vitepressConfig } from './tmpl.ts.-config.ts';
import { main } from './tmpl.ts.-main.ts';
import { nav } from './tmpl.ts.-nav.ts';

export const Typescript = {
  Components,
  userConfig,
  vitepressConfig,
  markdownConfig,
  nav,
  main,
} as const;
