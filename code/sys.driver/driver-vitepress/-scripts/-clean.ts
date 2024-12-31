import { Fs } from '@sys/fs';
const remove = (path: string) => Fs.remove(Fs.resolve(path), { log: true });

await remove('./.tmp');
await remove('./dist');
await remove('./docs');
await remove('./node_modules');
