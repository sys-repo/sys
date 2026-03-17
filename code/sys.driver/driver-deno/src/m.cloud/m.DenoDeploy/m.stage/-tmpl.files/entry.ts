import { DenoEntry } from '@sys/driver-deno/cloud';
import { Fs } from '@sys/fs';
import { targetDir } from './entry.paths.ts';

const cwd = Fs.Path.fromFileUrl(new URL('.', import.meta.url));

export default await DenoEntry.serve({ cwd, targetDir });
