import { DenoFile } from '../m.DenoFile/mod.ts';
import { Glob, Is, Obj, type t } from './common.ts';

type O = Record<string, unknown>;

/**
 * List tasks from a `deno.json` file using inclusion and exclusion patterns.
 */
export async function list(
  options: t.DenoTask.List.Options,
): Promise<readonly t.DenoTask.Task[]> {
  const res = await DenoFile.load(options.cwd);
  if (!res.ok || !res.data) {
    throw new Error(`Failed to read deno.json: ${res.error?.message ?? res.errorReason}`);
  }

  const tasks: O = Is.record(res.data.tasks) ? res.data.tasks : {};
  const rows: t.DenoTask.Task[] = [];

  for (const [name, command] of Obj.entries(tasks)) {
    if (!Is.str(name) || !Is.str(command)) continue;
    if (!Glob.matches(options.include, name)) continue;
    if (Glob.matches(options.exclude, name)) continue;
    rows.push({ name, command });
  }

  return rows;
}
