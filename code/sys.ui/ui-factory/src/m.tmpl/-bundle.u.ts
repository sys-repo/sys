import { c, Fs, PATHS, TmplEngine } from './common.ts';

if (import.meta.main) {
  const source = PATHS.tmpl.source;
  const target = PATHS.tmpl.json;
  const bundle = await TmplEngine.bundle(source, target);
  console.info(`${c.green('Wrote')} bundle to:`, c.gray(Fs.trimCwd(bundle.file)));
}
