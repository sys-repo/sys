import { c, Cmd, Fs, Path, Paths } from './u.ts';

type DenoJson = {
  name: string;
  version: string;
  tasks?: { clean?: string };
};

const deletePattern = async (pattern: string, options: { dry?: boolean } = {}) => {
  const { dry } = options;
  const glob = Fs.glob();
  const paths = (await glob.find(pattern)).filter((m) => m.isFile).map((m) => m.path);
  for (const path of paths) {
    if (!dry) await Deno.remove(path);

    let line = `${c.red('Delete')}: ${c.white(path)}`;
    if (dry) line = `${c.bgGreen(c.white(' dry run '))} ${line}`;
    console.info(line);
  }
};

/**
 * Run the "clean" task across the mono-repo.
 */
const run = async (path: string) => {
  const mod = await import(Path.resolve(path, 'deno.json'), { with: { type: 'json' } });
  const deno = mod.default as DenoJson;
  if (!deno.tasks?.clean) return; // NB: check the task exists before running.

  const cmd = 'deno task clean';
  await Cmd.sh({ silent: true, path }).run(cmd);
  console.info(`${c.cyan(cmd)}: ${c.white(path)}`);
};

for (const path of Paths.workspace) {
  await run(path);
}

/**
 * Query for temporary file/build noise.
 */
await deletePattern('**/vite.config.ts.timestamp-*');

console.log();
