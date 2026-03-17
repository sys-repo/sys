import { DenoEntry } from '@sys/driver-deno/cloud';
import { Path } from '@sys/std/path';
import { targetDir } from './entry.paths.ts';

const cwd = Path.fromFileUrl(new URL('.', import.meta.url));

export default await DenoEntry.serve({ cwd, targetDir });
