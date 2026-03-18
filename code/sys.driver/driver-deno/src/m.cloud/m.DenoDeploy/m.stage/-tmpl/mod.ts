/**
 * @module
 * Embedded staged entry templates for DenoDeploy staging.
 */
import { Fs, Args, TmplEngine } from '../common.ts';
export { renderStageEntrypoints } from './-bundle.ts';

export const FILE = {
  entry: 'entry.ts',
  entryPaths: 'entry.paths.ts',
  compatEntrypoint: 'src/m.server/main.ts',
} as const;

export const PATHS = resolvePaths(import.meta.url);

export async function makeBundle() {
  if (PATHS.root.length === 0) {
    throw new Error('DenoDeploy.stage templates can only be bundled from a local file workspace.');
  }
  const bundle = await TmplEngine.bundle(PATHS.files, PATHS.json);
  console.info(TmplEngine.Log.bundled(bundle));
}

if (import.meta.main) {
  const { bundle } = Args.parse<{ bundle?: boolean }>(Deno.args);
  if (bundle) await makeBundle();
}

function resolvePaths(url: string) {
  if (!url.startsWith('file:')) {
    return {
      root: '',
      files: '',
      json: '',
    } as const;
  }

  const root = Fs.dirname(Fs.Path.fromFileUrl(url));
  return {
    root,
    files: Fs.join(Fs.dirname(root), '-tmpl.files'),
    json: Fs.join(root, '-bundle.json'),
  } as const;
}
