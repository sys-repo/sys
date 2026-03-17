import { D, Fs, TmplEngine } from './common.ts';

/**
 * Make `bundle.json` file.
 */
if (import.meta.main) {
  const cwd = Fs.cwd();
  const res = await TmplEngine.bundle(Fs.join(cwd, D.Path.source), {
    targetFile: Fs.join(cwd, D.Path.target),
    filter: (e) => e.path.includes('/-tmpl'),
  });
  console.info(TmplEngine.Log.bundled(res));
}
