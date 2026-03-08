import { Fs } from './common.ts';

const log = true;

async function remove(pattern: string) {
  const paths = await Fs.glob('.').find(pattern);
  for (const path of paths) await Fs.remove(path.path, { log });
}

await Fs.remove('./.tmp', { log });
await Fs.remove('./-scripts/.tmp', { log });
await remove('src/**/.tmp');
await remove('src/**/deno.lock');
await remove('src/-test/**/node_modules');
await remove('src/-test/**/dist');
