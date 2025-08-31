import { PATHS, TmplEngine } from './common.ts';

if (import.meta.main) {
  const result = await TmplEngine.FileMap.bundle(PATHS.tmpl.source, PATHS.tmpl.json);
  console.info('Wrote bundle to:', result.file);
}
