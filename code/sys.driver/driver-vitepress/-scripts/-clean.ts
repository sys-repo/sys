import { Fs } from '@sys/std-s';
import { cleanTestFolder } from '../src/-test/-clean.ts';
const remove = (path: string) => Fs.remove(Fs.resolve(path), { log: true });

await remove('./.tmp');
await remove('./dist');
await remove('./docs');
await remove('./node_modules');
await cleanTestFolder();
