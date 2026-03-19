import { Args, c, Cli } from '@sys/cli';
import { Fs, Path, TmplEngine } from '@sys/tmpl-engine';
import { Templates } from '../common.ts';

export * from '../common.ts';
export { Args, c, Cli, Fs, Path, TmplEngine };

/**
 * Constants:
 */
const MODULE_ROOT = Fs.resolve(import.meta.dirname ?? '.', '../..');

export const PATHS = {
  root: MODULE_ROOT,
  templates: Fs.join(MODULE_ROOT, '-templates'),
  json: Fs.join(MODULE_ROOT, 'src/m.tmpl/-bundle.json'),
} as const;

/**
 * Names of all templates.
 */
export const TemplateNames: readonly string[] = [
  ...Object.keys(Templates),
] as const;
