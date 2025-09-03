import { Args, c, Cli } from '@sys/cli';
import { Fs, Path, TmplEngine } from '@sys/tmpl-engine';
import { Templates } from '../common.ts';

export * from '../common.ts';
export { Args, c, Cli, Fs, Path, TmplEngine };

/**
 * Constants:
 */
export const PATHS = {
  templates: '../../-tmpl/',
  json: 'src/m.tmpl/-bundle.json',
} as const;

/**
 * Prepare embedded asset bundle of template files.
 */
export async function makeBundle() {
  const src = Fs.resolve(PATHS.templates);
  const bundle = await TmplEngine.bundle(src, PATHS.json);
  console.info(TmplEngine.Log.bundled(bundle));
}

/**
 * Names of all templates.
 */
export const TemplateNames: readonly string[] = [
  ...Object.keys(Templates),

  // Modules:
  '@sys/ui-factory/tmpl',
] as const;
