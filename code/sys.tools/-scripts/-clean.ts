import { Fs } from '@sys/fs';
await Fs.remove('./.tmp/-backup', { log: true });
await Fs.ensureDir('./.tmp');
