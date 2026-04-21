import { WorkspacePrep } from '../m.prep/mod.ts';
import { Arr, Err, Fs, Is, Num, Obj, Process, Str, type t, Time } from './common.ts';

export async function runTask(
  task: t.WorkspaceRun.Task,
  args: t.WorkspaceRun.Args = {},
): Promise<t.WorkspaceRun.Result> {
  const cwd = args.cwd ?? Fs.cwd();
  const startedAt = Time.now.timestamp;
  const graph = await resolveGraph(cwd, args);
  const candidates = await wrangle.candidates(cwd, task, graph.orderedPaths, args.filter);
  const orderedPaths = candidates.map((item) => item.dir);
  console.info(`workspace ${task} → ${orderedPaths.length} packages ordered`);
  const packages: t.WorkspaceRun.Package.Result[] = [];

  for (const candidate of candidates) {
    if (!hasTask(candidate.deno, task)) {
      packages.push({ kind: 'skipped', path: candidate.dir, reason: 'task:missing' });
      continue;
    }

    console.info(Str.dedent(`
      workspace ${task} → ${candidate.dir}
    `));

    const packageStartedAt = Time.now.timestamp;
    const output = await Process.inherit({
      cwd: Fs.join(cwd, candidate.dir),
      cmd: 'deno',
      args: ['task', task],
    });
    const ran: t.WorkspaceRun.Package.Ran = {
      kind: 'ran',
      path: candidate.dir,
      code: output.code,
      success: output.success,
      signal: output.signal,
      elapsed: Time.now.timestamp - packageStartedAt,
    };

    packages.push(Obj.clone(ran));
    if (!output.success) {
      const elapsed = Time.now.timestamp - startedAt;
      return {
        ok: false,
        task,
        cwd,
        elapsed,
        orderedPaths,
        packages,
        failure: ran,
      };
    }
  }

  const elapsed = Time.now.timestamp - startedAt;

  return {
    ok: true,
    task,
    cwd,
    elapsed,
    orderedPaths: Arr.uniq([...orderedPaths]),
    packages,
  };
}

/**
 * Helpers:
 */
async function resolveGraph(cwd: t.StringDir, args: t.WorkspaceRun.Args) {
  if (args.graph) {
    console.info('workspace graph → using provided graph');
    return args.graph;
  }

  if (args.rebuildGraph === true) {
    console.info('workspace graph → rebuilding');
    return await WorkspacePrep.Graph.build(cwd);
  }

  console.info('workspace graph → loading snapshot');
  const snapshot = await WorkspacePrep.Graph.read(cwd);
  if (snapshot) {
    console.info('workspace graph → using snapshot');
    return snapshot.graph;
  }

  console.info('workspace graph → snapshot missing, rebuilding');
  return await WorkspacePrep.Graph.build(cwd);
}

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

type Candidate = {
  readonly dir: t.StringDir;
  readonly pkg: t.Pkg;
  readonly deno: Record<string, unknown>;
};

const wrangle = {
  async candidates(
    cwd: t.StringDir,
    task: t.WorkspaceRun.Task,
    paths: readonly t.StringPath[],
    filter?: t.WorkspaceRun.Filter,
  ) {
    const candidates: Candidate[] = [];

    for (const path of paths) {
      const dir = path as t.StringDir;
      const deno = await readManifest(Fs.join(cwd, dir, 'deno.json'));
      const pkg = wrangle.pkg(deno, dir);
      if (filter && !filter({ dir, pkg, task })) continue;
      candidates.push({ dir, pkg, deno });
    }

    return candidates;
  },

  pkg(deno: Record<string, unknown>, dir: t.StringDir): t.Pkg {
    const name = deno.name;
    const version = deno.version;
    if (!Is.str(name) || !name.trim()) {
      throw Err.std(`Workspace.Run: package missing name: ${dir}`);
    }
    if (!Is.str(version) || !version.trim()) {
      throw Err.std(`Workspace.Run: package missing version: ${dir}`);
    }
    return { name, version };
  },
} as const;
