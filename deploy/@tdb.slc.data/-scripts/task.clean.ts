import { Fs } from '@sys/fs';

await Fs.remove('./.tmp', { log: true });
await Fs.remove('./-config/@tdb.slc-data/stage/sample-1.yaml', { log: true });
