import { Fs } from '@sys/fs';

await Fs.remove('./dist', { log: true });
await Fs.remove('./.tmp', { log: true });
