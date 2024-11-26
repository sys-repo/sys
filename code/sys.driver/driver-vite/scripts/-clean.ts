import { Fs } from '@sys/std-s';
const remove = (path: string) => Fs.remove(Fs.resolve(path), { log: true });

await remove('./dist');
await remove('./.tmp');
