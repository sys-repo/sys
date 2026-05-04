// Bundle-only dependencies stay out of ../common.ts so runtime help readers do not load template tools.
import { Fs, TmplEngine } from '@sys/tmpl-engine';

const SourcePrefix = 'yaml/';

export async function bundleHelp() {
  const root = Fs.resolve(import.meta.dirname ?? '.', '..');
  const res = await TmplEngine.bundle(root, {
    targetFile: Fs.join(root, '-bundle/-bundle.json'),
    filter: (e) => e.path.startsWith(SourcePrefix) && e.path.endsWith('.yaml'),
  });
  console.info(TmplEngine.Log.bundled(res));
  return res;
}

if (import.meta.main) {
  await bundleHelp();
}
