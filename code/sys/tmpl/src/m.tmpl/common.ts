import { Args, c, Cli } from '@sys/cli';
import { Fs, Path, TmplEngine } from '@sys/tmpl-engine';
import { Templates } from '../../-tmpl/mod.ts';

export * from '../common.ts';
export { Args, c, Cli, Fs, Path, Templates, TmplEngine };

/**
 * Constants:
 */
export const PATHS = {
  templates: '-tmpl/',
  json: 'src/m.tmpl/-bundle.json',
} as const;

/**
 * Prepare embedded asset bundle of template files.
 */
export async function makeBundle() {
  const bundle = await TmplEngine.bundle(PATHS.templates, PATHS.json);
  console.info(TmplEngine.Log.bundled(bundle));
}

/**
 * Names of all templates.
 */
export const TemplateNames: string[] = [
  ...Object.keys(Templates),
  //
  // External module templates:
  '@sys/ui-factory/tmpl',
] as const;
