/**
 * @module
 * Embedded staged entry templates for DenoDeploy staging.
 */
import { Fs, Args, TmplEngine } from '../common.ts';
export { renderStageEntrypoints } from './-bundle.ts';

const root = Fs.dirname(Fs.Path.fromFileUrl(import.meta.url));
export const PATHS = {
  root,
  files: Fs.join(Fs.dirname(root), '-tmpl.files'),
  json: Fs.join(root, '-bundle.json'),
} as const;

export async function makeBundle() {
  const bundle = await TmplEngine.bundle(PATHS.files, PATHS.json);
  console.info(TmplEngine.Log.bundled(bundle));
}

if (import.meta.main) {
  const { bundle } = Args.parse<{ bundle?: boolean }>(Deno.args);
  if (bundle) await makeBundle();
}
