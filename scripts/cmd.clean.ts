import { c, Cmd, Fs, Path, Paths } from './u.ts';

type DenoJson = {
  name: string;
  version: string;
  tasks?: { clean?: string };
};

const deletePattern = async (pattern: string, dry: boolean = false) => {
  const glob = Fs.glob();
  const paths = (await glob.find(pattern)).filter((m) => m.isFile).map((m) => m.path);
  for (const path of paths) {
    if (!dry) await Deno.remove(path);

    let line = `${c.cyan('delete')} ${c.white(path)}`;
    if (dry) line = `${c.bgGreen(c.white(' dry run '))} ${line}`;
    console.info(line);
  }
  return paths.length;
};

/**
 * Run the "clean" task across the mono-repo.
 */
const run = async (path: string) => {
  const mod = await import(Path.resolve(path, 'deno.json'), { with: { type: 'json' } });
  const deno = mod.default as DenoJson;
  if (!deno.tasks?.clean) return; // NB: check the task exists before running.

  await Cmd.sh({ silent: true, path }).run('deno task clean');
  console.info(`${c.cyan('     clean')} ${c.gray(path)}`);
};

for (const path of Paths.workspace) {
  await run(path);
}
console.info();

/**
 * Query for temporary file/build noise.
 */
let total = 0;
total += await deletePattern('**/vite.config.ts.timestamp-*');

if (total > 0) console.info();
