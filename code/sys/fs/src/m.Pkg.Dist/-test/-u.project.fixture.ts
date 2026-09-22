import { Fs } from '../../m.Fs/mod.ts';
import { Pkg } from '../../m.Pkg/mod.ts';
import type { t } from '../../common.ts';

export const limits: t.Pkg.Dist.Verify.Limits = {
  manifestBytes: 65_536,
  entries: 64,
  fileBytes: 1024,
  totalBytes: 4096,
};
export const batch = { inventories: 2, totalBytes: 4096 };
export const binary = new Uint8Array([0, 255, 254, 128]);

export async function fixture(sourceName = 'source') {
  const temp = await Fs.makeTempDir({ prefix: 'Pkg.Dist.project-' });
  const root = await Fs.realPath(temp.absolute);
  const source = Fs.join(root, sourceName);
  await Fs.write(Fs.join(source, 'index.html'), 'shell', { throw: true });
  await Fs.write(Fs.join(source, 'assets/data.bin'), binary, { throw: true });
  await Fs.write(Fs.join(source, 'spare.txt'), 'spare', { throw: true });
  const computed = await Pkg.Dist.compute({ dir: source, save: true });
  const args: t.Pkg.Dist.Project.Args<'a' | 'z'> = {
    root,
    source: { dir: sourceName, integrity: computed.manifest.integrity },
    outputs: { z: 'two', a: 'one' },
    limits: { ...limits },
    batch: { ...batch },
    select: () => ({ a: ['index.html'], z: ['assets/data.bin'] }),
  };
  return {
    root,
    source,
    args,
    async [Symbol.asyncDispose]() {
      await Fs.remove(root);
    },
  };
}
