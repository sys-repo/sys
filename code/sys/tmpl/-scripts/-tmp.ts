import { Fs } from '@sys/fs';

const clear = async (root: string) => {
  const paths = await Fs.glob(root, { includeDirs: true }).find('*');
  for (const p of paths) await Fs.remove(p.path, { log: true });
};

await clear('./.tmp');
await clear('./src/.tmp');
