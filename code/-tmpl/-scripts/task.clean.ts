import { Fs } from '@sys/fs';

const log = true;
const force = true;

await Fs.remove('./.tmp', { log, force });
await Fs.remove('./-templates/tmpl.repo/node_modules', { log, force });
