import { Fs } from '@sys/fs';

console.info('🐷-tmp');

const paths = await Fs.glob('./.tmp', { includeDirs: true }).find('*');
for (const p of paths) await Fs.remove(p.path, { log: true });
