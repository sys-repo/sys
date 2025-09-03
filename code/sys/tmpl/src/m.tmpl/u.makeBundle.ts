import { type t, Fs, PATHS, Templates, TmplEngine } from './common.ts';

/**
 * Prepare embedded asset bundle of template files.
 */
export async function makeBundle() {
  const src = Fs.resolve(PATHS.templates);
  const targetFile = PATHS.json;

  const filter: t.FileMapFilter = (e) => {
    // NOTE: in the monorepo `-tmpl/*` folder the actual template folders
    //       are prefixed with '-tmpl/tmpl.<name>` naming format.
    return e.path.startsWith('tmpl.');
  };

  const bundle = await TmplEngine.bundle(src, { targetFile, filter });
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
