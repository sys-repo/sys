import { Fs } from '@sys/fs';

// const paths = await Fs.glob('./.tmp', { includeDirs: true }).find('*');
// for (const p of paths) await Fs.remove(p.path, { log: true });

import { cli } from '@sys/ui-factory/tmpl';
await cli();
