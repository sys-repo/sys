import { Fs } from '@sys/std-s';

const removeDir = (path: string) => Fs.remove(Fs.resolve(path), { log: true });
await removeDir('./.tmp');
await removeDir('./docs');
