import { Fs } from '@sys/fs';
import { Log } from '@sys/std/log';
const log = Log.logger('Foobar');

log('👋 Hello');
log.sub('tmp')('🐷-tmp');

// await clear('./.tmp');

/**
 * Helpers:
 */
async function clear(root: string) {
  const paths = await Fs.glob(root, { includeDirs: true }).find('*');
  for (const p of paths) await Fs.remove(p.path, { log: true });
}
