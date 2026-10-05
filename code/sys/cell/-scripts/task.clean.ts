import { Fs } from '@sys/fs';

await Fs.remove('./.tmp', { log: true });
await Fs.remove('./-sample/foo', { log: true });
await Fs.remove('./-sample/cell.deploy/.tmp', { log: true });
await Fs.remove('./-sample/cell.deploy/view/.pulled', { log: true });

await Fs.ensureDir('./-sample/foo');
