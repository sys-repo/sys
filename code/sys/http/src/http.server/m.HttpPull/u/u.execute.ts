import { HttpClient, Is, Num, Rx, Schedule, type t } from '../common.ts';
import { isAbortError } from './u.abort.ts';
import { eventQueue, eventView } from './u.events.ts';
import { pullOne } from './u.pullOne.ts';
import { preflightResources, pullResource } from './u.resource.ts';
import { resolveTarget } from './u.target.ts';

type Execute = {
  (
    resources: readonly t.HttpPull.Resource[],
    rooted: t.Fs.Rooted.Instance,
    options: t.HttpPull.ResourceOptions,
  ): t.HttpPull.Stream.Instance;
  (
    urls: readonly string[],
    dir: t.StringDir,
    options: t.HttpPull.Options,
  ): t.HttpPull.Stream.Instance;
};

type Destination = t.StringDir | t.Fs.Rooted.Instance;
type PullOptions = t.HttpPull.Options | t.HttpPull.ResourceOptions;
type MakeClient = t.HttpFetch.Lib['make'];
type PreparedResource = Extract<
  Awaited<ReturnType<typeof preflightResources>>,
  { readonly ok: true }
>['resources'][number];

type Context = {
  readonly source: t.StringUrl;
  readonly target: t.StringPath;
};

type Task = Context & {
  readonly index: t.Index;
  readonly run: (signal: AbortSignal) => Promise<t.HttpPull.Record>;
};

type LegacySnapshot =
  & {
    readonly contexts: readonly Context[];
    readonly concurrency: number;
    readonly retry: t.HttpPull.Options['retry'];
  }
  & (
    | { readonly client: t.HttpFetch.Instance; readonly policy?: undefined }
    | { readonly client?: undefined; readonly policy: t.HttpFetch.ResponsePolicy }
  );

const CANCELLED = 'Pull operation cancelled';
const EXECUTION_FAILED = 'Pull execution failed';
const SECURE_EXECUTION_FAILED = 'Secure pull execution failed';
const EVENT_BUFFER_LIMIT = 256;

/** Bind the operation kernel to a Fetch factory without changing transport ownership rules. */
export function createExecutor(makeClient: MakeClient = HttpClient.fetcher): Execute {
  return ((input, destination, options) =>
    createOperation(makeClient, input, destination, options)) as Execute;
}

/** Execute legacy and checksum-bound pulls through one operation kernel. */
export const execute = createExecutor();

function createOperation(
  makeClient: MakeClient,
  input: readonly t.HttpPull.Resource[] | readonly string[],
  destination: Destination,
  options: PullOptions,
): t.HttpPull.Stream.Instance {
  const life = Rx.lifecycle(options.until);
  const controller = new AbortController();
  const signal = controller.signal;
  const queue = eventQueue(EVENT_BUFFER_LIMIT);
  const subject$ = Rx.subject<t.HttpPull.Event.Any>();
  // Sparse while running; each stable slot belongs to one input index.
  const records: Array<t.HttpPull.Record | undefined> = [];
  const executionError = Is.str(destination) ? EXECUTION_FAILED : SECURE_EXECUTION_FAILED;
  let contexts: readonly Context[] = [];
  let tasks: readonly Task[] = [];
  let ownedClient: t.HttpFetch.Instance | undefined;
  let failed = false;
  let finished = false;

  // Abort reasons remain private operation authority; public cancellation is canonicalized later.
  life.dispose$.subscribe((event) => {
    if (!signal.aborted) controller.abort(event.reason);
  });
  if (life.disposed && !signal.aborted) controller.abort('disposed');

  // `run` settles only after every started worker does; final accounting therefore means quiescence.
  const settled = run()
    .catch((cause: unknown) => {
      failed = true;
      if (signal.aborted || isAbortError(cause)) return;
      fillMissing(executionError);
    })
    .finally(() => {
      if (signal.aborted) fillCancelled();
      else fillMissing(executionError);

      try {
        ownedClient?.dispose('pull:complete');
      } catch {
        // Cleanup failure cannot rewrite already terminal per-input publication evidence.
      } finally {
        finished = true;
        life.dispose('pull:complete');
        queue.close();
        subject$.complete();
      }
    });

  // Finalization fills every sparse slot before exposing the aggregate result.
  const done: Promise<t.HttpPull.ToDir.Result> = settled.then(() => {
    const ops = records as readonly t.HttpPull.Record[];
    const ok = !failed && ops.every((record) => record.ok);
    return { ok, ops } as t.HttpPull.ToDir.Result;
  });

  async function run(): Promise<void> {
    if (Is.str(destination)) {
      await runLegacy(input as readonly string[], destination, options as t.HttpPull.Options);
    } else {
      await runSecure(
        input as readonly t.HttpPull.Resource[],
        destination,
        options as t.HttpPull.ResourceOptions,
      );
    }
  }

  async function runLegacy(
    urls: readonly string[],
    dir: t.StringDir,
    legacyOptions: t.HttpPull.Options,
  ): Promise<void> {
    const snapshot = snapshotLegacy(urls, dir, legacyOptions);
    contexts = snapshot.contexts;
    records.length = contexts.length;

    // Latch pre-ended lifecycles before creating an internally owned transport.
    await Schedule.micro();
    if (signal.aborted) return;

    let client: t.HttpFetch.Instance;
    if (snapshot.client) {
      client = snapshot.client;
    } else {
      client = makeClient({ policy: snapshot.policy, until: signal });
      ownedClient = client;
    }

    tasks = contexts.map((context, index): Task => ({
      ...context,
      index: index as t.Index,
      run: (taskSignal) =>
        pullOne(context.source, context.target, client, {
          retry: snapshot.retry,
          signal: taskSignal,
        }),
    }));
    await runWorkers(tasks, snapshot.concurrency, runTask, signal);
  }

  async function runSecure(
    resources: readonly t.HttpPull.Resource[],
    rooted: t.Fs.Rooted.Instance,
    resourceOptions: t.HttpPull.ResourceOptions,
  ): Promise<void> {
    const preflight = await preflightResources(resources, rooted, signal);
    contexts = preflight.ok
      ? preflight.resources.map(({ source, target }) => ({
        source: source.input,
        target: target.path,
      }))
      : preflight.records.map(({ path }) => path);
    records.length = contexts.length;

    if (signal.aborted) {
      // Preserve aggregate failure when malformed input produced no per-input evidence.
      failed ||= !preflight.ok && records.length === 0;
      return;
    }

    if (!preflight.ok) {
      failed = true;
      preflight.records.forEach((record, index) => {
        records[index] = record;
        emitTerminal(index, record);
      });
      return;
    }

    const client = makeClient({ policy: resourceOptions.policy, until: signal });
    ownedClient = client;
    tasks = secureTasks(preflight.resources, rooted, client);
    // Secure scheduling remains serial until bounded resource policy owns concurrency.
    await runWorkers(tasks, 1, runTask, signal);
  }

  async function runTask(task: Task): Promise<void> {
    if (signal.aborted) return;
    emit({ kind: 'start', index: task.index, total: records.length, url: task.source });
    if (signal.aborted) return;

    try {
      const record = await task.run(signal);
      // Cancellation cannot rewrite bytes already published or a trusted committed failure.
      if (signal.aborted && !isCommitted(record)) return;
      if (records[task.index]) return;

      records[task.index] = record;
      failed ||= !record.ok;
      emitTerminal(task.index, record);
    } catch (cause) {
      if (signal.aborted || isAbortError(cause)) return;
      if (records[task.index]) return;

      failed = true;
      const record = executionFailure(task, executionError);
      records[task.index] = record;
      emitTerminal(task.index, record);
    }
  }

  function fillCancelled(): void {
    failed ||= fillUnsettled((context) => cancellation(context));
  }

  function fillMissing(error: string): void {
    failed ||= fillUnsettled((context) => executionFailure(context, error));
  }

  function fillUnsettled(
    createRecord: (context: Context) => t.HttpPull.RecordFailure,
  ): boolean {
    let found = false;
    for (let index = 0; index < records.length; index++) {
      if (records[index]) continue;
      found = true;
      const record = createRecord(contexts[index] ?? { source: '', target: '' });
      records[index] = record;
      emitTerminal(index, record);
    }
    return found;
  }

  function emitTerminal(index: number, record: t.HttpPull.Record): void {
    emit(
      record.ok
        ? {
          kind: 'done',
          index: index as t.Index,
          total: records.length,
          url: record.path.source,
          record,
        }
        : {
          kind: 'error',
          index: index as t.Index,
          total: records.length,
          url: record.path.source,
          record,
        },
    );
  }

  function emit(event: t.HttpPull.Event.Any): void {
    if (finished) return;
    queue.push(event);
    subject$.next(event);
  }

  const iterator = async function* () {
    try {
      for await (const event of queue) yield event;
    } finally {
      if (!finished) life.dispose('iterator:closed');
    }
  };

  return {
    [Symbol.asyncIterator]: () => iterator(),
    cancel: (reason?: unknown) => life.dispose(reason),
    done,
    events: (until?: t.UntilInput) => eventView(subject$, until),
  };
}

function snapshotLegacy(
  input: readonly string[],
  dir: t.StringDir,
  options: t.HttpPull.Options,
): LegacySnapshot {
  const urls = [...input];
  const map = options.map;
  const contexts = Object.freeze(urls.map((source): Context =>
    Object.freeze({
      source,
      target: resolveTarget(source, dir, map),
    })
  ));
  const client = options.client;
  return Object.freeze({
    contexts,
    concurrency: normalizeConcurrency(options.concurrency),
    retry: snapshotRetry(options.retry),
    ...(client ? { client } : { policy: options.policy }),
  });
}

function secureTasks(
  resources: readonly PreparedResource[],
  rooted: t.Fs.Rooted.Instance,
  client: t.HttpFetch.Instance,
): readonly Task[] {
  return resources.map((resource, index): Task => ({
    index: index as t.Index,
    source: resource.source.input,
    target: resource.target.path,
    run: (signal) => pullResource(resource, rooted, client, { signal }),
  }));
}

async function runWorkers(
  tasks: readonly Task[],
  concurrency: number,
  run: (task: Task) => Promise<void>,
  signal: AbortSignal,
): Promise<void> {
  let next = 0;
  // Claim indexes only at free capacity; cancellation leaves no eager task queue to drain.
  const worker = async () => {
    while (!signal.aborted) {
      const index = next++;
      if (index >= tasks.length) return;
      await run(tasks[index]);
    }
  };
  const count = Num.clamp(0, concurrency, tasks.length);
  await Promise.all(Array.from({ length: count }, worker));
}

function normalizeConcurrency(input: number | undefined): number {
  if (input === undefined) return 8;
  return Num.Is.safeInt(input) ? Num.clamp(1, Num.MAX_INT, input) : 8;
}

function snapshotRetry(input: t.HttpPull.Options['retry']): t.HttpPull.Options['retry'] {
  if (!Is.object(input)) return input;
  return Object.freeze({
    attempts: input.attempts,
    base: input.base,
    factor: input.factor,
    jitter: input.jitter,
  });
}

function cancellation(path: t.HttpPull.Record['path']): t.HttpPull.RecordCancelled {
  return { ok: false, status: 499, cancelled: true, error: CANCELLED, path };
}

function executionFailure(context: Context, error: string): t.HttpPull.RecordFailure {
  return {
    ok: false,
    error,
    path: { source: context.source, target: context.target },
  };
}

function isCommitted(record: t.HttpPull.Record): boolean {
  return record.ok || record.filesystem?.committed === true;
}
