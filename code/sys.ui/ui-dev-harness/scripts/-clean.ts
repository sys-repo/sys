import { Fs } from '@sys/fs';

const removeDir = (path: string) => Fs.remove(Fs.resolve(path), { log: true });
await removeDir('./.tmp');
await removeDir('./dist');
await removeDir('./.swc');
