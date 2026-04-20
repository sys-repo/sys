import { WorkspacePrep } from '../m.prep/mod.ts';
import { Arr, Err, Fs, Is, Num, Obj, Process, Str, type t, Time } from './common.ts';

export async function runTask(
  task: t.WorkspaceRun.Task,
  args: t.WorkspaceRun.Args = {},
): Promise<t.WorkspaceRun.Result> {
  const cwd = args.cwd ?? Fs.cwd();
  const startedAt = Time.now.timestamp;
  const orderedPaths = (await WorkspacePrep.Graph.build(cwd)).orderedPaths;
  const packages: t.WorkspaceRun.PackageResult[] = [];

  for (const path of orderedPaths) {
    const manifestPath = Fs.join(cwd, path, 'deno.json');
    const deno = await readManifest(manifestPath);
    if (!hasTask(deno, task)) {
      packages.push({ kind: 'skipped', path, reason: 'task:missing' });
      continue;
    }

    console.info(Str.dedent(`
      workspace ${task} → ${path}
    `));

    const output = await Process.inherit({
      cwd: Fs.join(cwd, path),
      cmd: 'deno',
      args: ['task', task],
    });
    const ran: t.WorkspaceRun.PackageRan = {
      kind: 'ran',
      path,
      code: output.code,
      success: output.success,
      signal: output.signal,
    };

    packages.push(Obj.clone(ran));
    if (!output.success) {
      return { ok: false, task, cwd, orderedPaths, packages, failure: ran };
    }
  }

  const elapsed = String(Time.elapsed(startedAt));
  const ranTotal = packages.filter((item) => item.kind === 'ran').length;
  const skippedTotal = packages.filter((item) => item.kind === 'skipped').length;
  console.info(`workspace ${task} done → ${ranTotal} ran, ${skippedTotal} skipped in ${elapsed}`);

  return {
    ok: true,
    task,
    cwd,
    orderedPaths: Arr.uniq([...orderedPaths]),
    packages,
  };
}

/**
 * Helpers:
 */
async function readManifest(path: t.StringPath): Promise<Record<string, unknown>> {
  const res = await Fs.readJson<Record<string, unknown>>(path);
  if (res.error) {
    throw Err.std(`Workspace.Run: failed to read deno.json: ${path}`, { cause: res.error });
  }
  return Obj.clone(res.data ?? {}) as Record<string, unknown>;
}

function hasTask(deno: Record<string, unknown>, task: t.WorkspaceRun.Task) {
  const tasks = deno.tasks;
  if (!Obj.isRecord(tasks)) return false;
  const value = tasks[task];
  return Is.str(value) && Num.clamp(0, 1, value.trim().length) === 1;
}
