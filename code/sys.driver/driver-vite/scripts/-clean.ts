import { Fs } from '@sys/std-s';

const removeDir = (path: string) => Fs.remove(Fs.resolve(path), { log: true });
await removeDir('./dist');
await removeDir('./.tmp');
