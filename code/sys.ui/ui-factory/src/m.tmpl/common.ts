export * from '../common.ts';
import { Args, c, Cli } from '@sys/cli';
import { Fs, Path, TmplEngine } from '@sys/tmpl-engine';

export { Semver } from '@sys/std/semver';
export { Args, c, Cli, Fs, Path, TmplEngine };

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
