import { Fs } from '@sys/fs';
await Fs.remove('./.tmp', { log: true });
await Fs.remove('./-templates/tmpl.repo/node_modules', { log: true });
