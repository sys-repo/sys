import { Fs, TmplEngine } from '../common.ts';

const SOURCE_PREFIX = 'tmpl.';

export async function bundleSandboxFs() {
  const root = Fs.resolve(import.meta.dirname ?? '.', '..');
  const res = await TmplEngine.bundle(root, {
    targetFile: Fs.join(root, '-bundle/-bundle.json'),
    filter: (e) => e.path.startsWith(SOURCE_PREFIX),
  });
  console.info(TmplEngine.Log.bundled(res));
  return res;
}

if (import.meta.main) {
  await bundleSandboxFs();
}
