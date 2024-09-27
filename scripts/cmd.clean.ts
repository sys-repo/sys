import { Cmd, Log, Path, Paths, type CmdResult } from './u.ts';

type DenoJson = {
  name: string;
  version: string;
  tasks?: { clean?: string };
};

/**
 * Run the linter across the mono-repo.
 */
const results: CmdResult[] = [];
const run = async (path: string) => {
  const mod = await import(Path.resolve(path, 'deno.json'), { with: { type: 'json' } });
  const deno = mod.default as DenoJson;
  if (!deno.tasks?.clean) return; // NB: check the task exists before running.

  const output = await Cmd.sh({ silent: true, path }).run(`deno task clean`);
  results.push({ output, path });
};

for (const path of Paths.workspace) {
  await run(path);
}

/**
 * Output.
 */
const success = Log.output(results, { title: 'Cleaned', pad: true });
if (!success) throw new Error('Clean Failed');
