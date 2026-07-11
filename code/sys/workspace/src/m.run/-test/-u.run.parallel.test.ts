import { describe, Err, expect, it, type t, Time } from '../../-test.ts';
import { createRunPlanFromCandidates, type RunPlan } from '../u/u.plan.ts';
import { type ParallelRunEvent, runParallel } from '../u/u.run.parallel.ts';
import type { PackageWorker } from '../u/u.worker.ts';

type Deferred = {
  readonly promise: Promise<void>;
  readonly resolve: () => void;
  readonly reject: (error?: unknown) => void;
};

describe('WorkspaceRun.parallel scheduler', () => {
  it('starts independent packages concurrently up to the jobs bound', async () => {
    const controls = controlMap(['code/a', 'code/b']);
    const starts: string[] = [];
    let active = 0;
    let maxActive = 0;
    const worker: PackageWorker = async ({ candidate }) => {
      starts.push(candidate.dir);
      active += 1;
      maxActive = active > maxActive ? active : maxActive;
      await getControl(controls, candidate.dir).promise;
      active -= 1;
      return ran(candidate.dir);
    };

    const pending = runParallel({
      cwd: '/tmp/workspace',
      task: 'test',
      plan: makePlan({ paths: ['code/a', 'code/b'] }),
      jobs: 2,
      startedAt: Time.now.timestamp,
      worker,
    });

    await Time.waitFor(() => starts.length === 2, { interval: 1, timeout: 1000 });
    expect(maxActive).to.eql(2);
    getControl(controls, 'code/a').resolve();
    getControl(controls, 'code/b').resolve();

    const result = await pending;
    expect(result.ok).to.eql(true);
    expect(starts).to.eql(['code/a', 'code/b']);
  });

  it('waits for dependency packages before launching dependents', async () => {
    const controls = controlMap(['code/a']);
    const starts: string[] = [];
    const worker: PackageWorker = async ({ candidate }) => {
      starts.push(candidate.dir);
      if (candidate.dir === 'code/a') await getControl(controls, candidate.dir).promise;
      return ran(candidate.dir);
    };

    const pending = runParallel({
      cwd: '/tmp/workspace',
      task: 'test',
      plan: makePlan({ paths: ['code/a', 'code/b'], edges: [{ from: 'code/a', to: 'code/b' }] }),
      jobs: 2,
      startedAt: Time.now.timestamp,
      worker,
    });

    await Time.waitFor(() => starts.length === 1, { interval: 1, timeout: 1000 });
    expect(starts).to.eql(['code/a']);
    await Time.wait(5);
    expect(starts).to.eql(['code/a']);

    getControl(controls, 'code/a').resolve();
    await Time.waitFor(() => starts.length === 2, { interval: 1, timeout: 1000 });
    const result = await pending;

    expect(result.ok).to.eql(true);
    expect(starts).to.eql(['code/a', 'code/b']);
  });

  it('treats skipped dependencies as terminal outcomes that unlock dependents', async () => {
    const starts: string[] = [];
    const worker: PackageWorker = async ({ candidate }) => {
      starts.push(candidate.dir);
      return ran(candidate.dir);
    };

    const result = await runParallel({
      cwd: '/tmp/workspace',
      task: 'test',
      plan: makePlan({
        paths: ['code/a', 'code/b'],
        edges: [{ from: 'code/a', to: 'code/b' }],
        missing: ['code/a'],
      }),
      jobs: 2,
      startedAt: Time.now.timestamp,
      worker,
    });

    expect(result.ok).to.eql(true);
    expect(starts).to.eql(['code/b']);
    expect(result.packages).to.eql([
      { kind: 'skipped', path: 'code/a', reason: 'task:missing' },
      ran('code/b'),
    ]);
  });

  it('stops new launches after first failure while awaiting in-flight packages', async () => {
    const controls = controlMap(['code/a', 'code/b']);
    const starts: string[] = [];
    const events: ParallelRunEvent[] = [];
    const worker: PackageWorker = async ({ candidate }) => {
      starts.push(candidate.dir);
      await getControl(controls, candidate.dir).promise;
      return ran(candidate.dir, candidate.dir !== 'code/a');
    };

    const pending = runParallel({
      cwd: '/tmp/workspace',
      task: 'test',
      plan: makePlan({ paths: ['code/a', 'code/b', 'code/c'] }),
      jobs: 2,
      startedAt: Time.now.timestamp,
      worker,
      onEvent: (event) => events.push(event),
    });

    await Time.waitFor(() => starts.length === 2, { interval: 1, timeout: 1000 });
    getControl(controls, 'code/a').resolve();
    await Time.waitFor(
      () => events.some((event) => event.kind === 'finish' && event.path === 'code/a'),
      { interval: 1, timeout: 1000 },
    );
    await Time.wait(5);
    expect(starts).to.eql(['code/a', 'code/b']);

    getControl(controls, 'code/b').resolve();
    const result = await pending;

    expect(result.ok).to.eql(false);
    if (!result.ok) expect(result.failure.path).to.eql('code/a');
    expect(starts).to.eql(['code/a', 'code/b']);
    expect(result.packages).to.eql([
      ran('code/a', false),
      ran('code/b'),
      { kind: 'blocked', path: 'code/c', reason: 'fail-fast' },
    ]);
  });

  it('marks dependency-blocked and fail-fast-blocked packages distinctly', async () => {
    const starts: string[] = [];
    const worker: PackageWorker = async ({ candidate }) => {
      starts.push(candidate.dir);
      return ran(candidate.dir, false);
    };

    const result = await runParallel({
      cwd: '/tmp/workspace',
      task: 'test',
      plan: makePlan({
        paths: ['code/a', 'code/b', 'code/c'],
        edges: [{ from: 'code/a', to: 'code/b' }],
      }),
      jobs: 1,
      startedAt: Time.now.timestamp,
      worker,
    });

    expect(result.ok).to.eql(false);
    expect(starts).to.eql(['code/a']);
    expect(result.packages).to.eql([
      ran('code/a', false),
      { kind: 'blocked', path: 'code/b', reason: 'dependency:failed' },
      { kind: 'blocked', path: 'code/c', reason: 'fail-fast' },
    ]);
  });

  it('uses graph order for jobs=1 package starts', async () => {
    const starts: string[] = [];
    const worker: PackageWorker = async ({ candidate }) => {
      starts.push(candidate.dir);
      return ran(candidate.dir);
    };

    const result = await runParallel({
      cwd: '/tmp/workspace',
      task: 'test',
      plan: makePlan({
        paths: ['code/a', 'code/b', 'code/c'],
        edges: [{ from: 'code/a', to: 'code/c' }],
      }),
      jobs: 1,
      startedAt: Time.now.timestamp,
      worker,
    });

    expect(result.ok).to.eql(true);
    expect(starts).to.eql(['code/a', 'code/b', 'code/c']);
  });

  it('returns graph-ordered results and selects canonical failure by graph order', async () => {
    const controls = controlMap(['code/a', 'code/b']);
    const starts: string[] = [];
    const worker: PackageWorker = async ({ candidate }) => {
      starts.push(candidate.dir);
      await getControl(controls, candidate.dir).promise;
      return ran(candidate.dir, false);
    };

    const pending = runParallel({
      cwd: '/tmp/workspace',
      task: 'test',
      plan: makePlan({ paths: ['code/a', 'code/b'] }),
      jobs: 2,
      startedAt: Time.now.timestamp,
      worker,
    });

    await Time.waitFor(() => starts.length === 2, { interval: 1, timeout: 1000 });
    getControl(controls, 'code/b').resolve();
    await Time.wait(5);
    getControl(controls, 'code/a').resolve();
    const result = await pending;

    expect(result.ok).to.eql(false);
    if (!result.ok) expect(result.failure.path).to.eql('code/a');
    expect(result.packages.map((item) => item.path)).to.eql(['code/a', 'code/b']);
    expect(result.packages).to.eql([ran('code/a', false), ran('code/b', false)]);
  });
});

function makePlan(args: {
  readonly paths: readonly string[];
  readonly edges?: readonly { readonly from: string; readonly to: string }[];
  readonly missing?: readonly string[];
}): RunPlan {
  const missing = new Set(args.missing ?? []);
  const graph: t.WorkspaceGraph.PersistedGraph = {
    orderedPaths: args.paths.map((path) => path as t.StringPath),
    edges: (args.edges ?? []).map((edge) => ({
      from: edge.from as t.StringPath,
      to: edge.to as t.StringPath,
    })),
  };
  const candidates = args.paths.map((path) => {
    const name = `@test/${path.replaceAll('/', '-')}`;
    const deno: Record<string, unknown> = {
      name,
      version: '1.0.0',
      tasks: missing.has(path) ? {} : { test: 'deno eval ""' },
    };
    return {
      dir: path as t.StringDir,
      pkg: { name, version: '1.0.0' },
      deno,
    };
  });
  return createRunPlanFromCandidates({ graph, candidates });
}

function ran(path: string, success = true): t.WorkspaceRun.Package.Ran {
  return {
    kind: 'ran',
    path,
    code: success ? 0 : 1,
    success,
    signal: null,
    elapsed: 1,
  };
}

function controlMap(paths: readonly string[]) {
  return new Map(paths.map((path) => [path, deferred()] as const));
}

function getControl(controls: Map<string, Deferred>, path: string) {
  const control = controls.get(path);
  if (!control) throw Err.std(`Missing control: ${path}`);
  return control;
}

function deferred(): Deferred {
  let resolve!: () => void;
  let reject!: (error?: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
