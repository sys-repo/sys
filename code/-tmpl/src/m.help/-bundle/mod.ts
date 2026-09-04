// Bundle-only dependencies stay out of ../common.ts so runtime help readers do not load template tools.
import { Fs, TmplEngine } from '@sys/tmpl-engine';
import { HelpResource } from '../u/u.paths.ts';

const SourceFiles = new Set<string>(HelpResource.Source.Files);

export async function bundleHelp() {
  const root = Fs.resolve(import.meta.dirname ?? '.', '..');
  const res = await TmplEngine.bundle(root, {
    targetFile: Fs.join(root, '-bundle/-bundle.json'),
    filter: (e) => SourceFiles.has(e.path),
  });
  console.info(TmplEngine.Log.bundled(res));
  return res;
}

if (import.meta.main) {
  await bundleHelp();
}
