import { type t, Fs, c, Fmt } from '../src/common.ts';

console.info('🐷-tmp');

const log = true;
// await clear('./.tmp');
// await Fs.remove('./.tmp/sys', { log });
// await Fs.remove('./.tmp/dev', { log });
// await Fs.remove('./.tmp/monaco/', { log });
// await Fs.remove('./.tmp/publish.assets/', { log });

/**
 * Helpers:
 */
async function clear(root: string) {
  const paths = await Fs.glob(root, { includeDirs: true }).find('*');
  for (const p of paths) await Fs.remove(p.path, { log: true });
}
