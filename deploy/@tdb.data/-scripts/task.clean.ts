import { Fs } from '@sys/fs';

await Fs.remove('./.tmp', { log: true });
await Fs.remove('./public/data', { log: true });
