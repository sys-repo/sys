import { Args, c, Cli } from '@sys/cli';
import { Fs, Path, TmplEngine } from '@sys/tmpl-engine';
import { Templates } from '../common.ts';

export * from '../common.ts';
export { Args, c, Cli, Fs, Path, TmplEngine };

/**
 * Constants:
 */
export const PATHS = {
  templates: '-templates/',
  json: 'src/m.tmpl/-bundle.json',
} as const;

/**
 * Names of all templates.
 */
export const TemplateNames: readonly string[] = [
  ...Object.keys(Templates),

  // Modules:
  '@sys/ui-factory/tmpl',
] as const;
