import { Fs } from '@sys/fs';
const remove = (path: string) => Fs.remove(path, { log: true });

await remove('./.tmp');
await remove('./-templates/tmpl.repo/node_modules');
await remove('./-templates/tmpl.repo/.tmp');
await remove('./-templates/tmpl.repo/deno.lock');
