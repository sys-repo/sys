import { Fs } from '@sys/fs';
const remove = (path: string) => Fs.remove(Fs.resolve(path), { log: true });

await remove('./dist');
await remove('./.tmp');
await remove('./node_modules');
