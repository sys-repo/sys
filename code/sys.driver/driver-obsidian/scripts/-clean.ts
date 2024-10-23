import { Fs } from '@sys/std-s';

const removeDir = (path: string) => Fs.removeDir(Fs.resolve(path), { log: true });
await removeDir('./.tmp');
