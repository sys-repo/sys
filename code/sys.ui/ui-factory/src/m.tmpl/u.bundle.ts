import { c, Fs, PATHS, TmplEngine } from './common.ts';

if (import.meta.main) {
  const result = await TmplEngine.FileMap.bundle(PATHS.tmpl.source, PATHS.tmpl.json);
  console.info(`${c.green('Wrote')} bundle to:`, c.gray(Fs.trimCwd(result.file)));
}
