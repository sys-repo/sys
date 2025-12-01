import { Fs } from '@sys/fs';

console.info('🐷-tmp');
// await clear('./.tmp');
await Fs.remove('./.tmp/hook.ts');

/**
 * Helpers:
 */
async function clear(root: string) {
  const paths = await Fs.glob(root, { includeDirs: true }).find('*');
  for (const p of paths) await Fs.remove(p.path, { log: true });
}
