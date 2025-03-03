import { Fs } from './common.ts';
const remove = (path: string) => Fs.remove(Fs.resolve(path), { log: true });

await remove('./dist');
await remove('./.tmp');
await remove('./.swc');
await remove('./node_modules');
