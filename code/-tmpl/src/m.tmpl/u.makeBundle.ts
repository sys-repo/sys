import { type t, Fs, PATHS, Templates, TmplEngine } from './common.ts';

const PREFIX = 'tmpl.';

/**
 * Prepare embedded asset bundle of template files.
 */
export async function makeBundle() {
  const src = Fs.resolve(PATHS.templates);
  const targetFile = PATHS.json;

  // NOTE: in the monorepo `-tmpl/*` folder the actual template folders
  //       are prefixed with '-tmpl/tmpl.<name>` naming format.
  const filter: t.FileMapFilter = (e) => e.path.startsWith(PREFIX);
  const res = await TmplEngine.bundle(src, {
    targetFile,
    filter,
    beforeWrite: (e) => e.modify(stripPrefix(e.fileMap)),
  });

  console.info(TmplEngine.Log.bundled(res));
}

/**
 * Names of all templates.
 */
export const TemplateNames: readonly string[] = [
  ...Object.keys(Templates),

  // Modules:
  '@sys/ui-factory/tmpl',
] as const;

/**
 * Helpers:
 */

function stripPrefix(fileMap: t.FileMap) {
  return Object.entries(fileMap).reduce((acc, [key, value]) => {
    if (key.startsWith(PREFIX)) key = key.slice(PREFIX.length);
    acc[key] = value;
    return acc;
  }, {} as t.FileMap);
}
