import { Err, Num, Rx, Schedule, Str, type t } from '../common.ts';
import { eventView } from '../u/u.events.ts';
import { admitResources, type PreparedResource } from './u.admit.ts';
import { RESOURCE_FAILURE, type ResourceFailure, terminalEvidence } from './u.failure.ts';
import { type PreparedStart, prepareStart, rejectStart } from './u.input.ts';
import {
  createResourceState,
  isCommittedResource,
  resourceFailureRecord,
  type ResourceState,
  transferResource,
} from './u.transfer.ts';
import { createDeadline, type Deadline } from './u.time.ts';

type MakeClient = t.HttpFetch.Lib['make'];

/** Own one checksum-pinned operation from synchronous snapshot through worker quiescence. */
export function createResourceOperation(
  makeClient: MakeClient,
  input: unknown,
): t.HttpPull.ResourceOperation.Instance {
  const startedAt = performance.now();
  let prepared = prepareStart(input);
  let life: ReturnType<typeof Rx.lifecycle>;
  try {
    life = Rx.lifecycle(prepared.ok ? prepared.until : undefined);
  } catch {
    prepared = rejectStart(prepared.resources, RESOURCE_FAILURE.input, prepared.resourceCount);
    life = Rx.lifecycle();
  }

  const authority: PreparedStart | undefined = prepared.ok ? prepared : undefined;
  const subject$ = Rx.subject<t.HttpPull.ResourceEvent.Any>();
  const controller = new AbortController();
  const records: Array<t.HttpPull.ResourceRecord | undefined> = [];
  const states = prepared.resources.map(createResourceState);
  records.length = states.length;

  let terminal: ResourceFailure | undefined = prepared.ok ? undefined : prepared.failure;
  let ownedClient: t.HttpFetch.Instance | undefined;
  let totalAttempts = 0;
  let transferredBytes = 0;
  let publishedBytes = 0;
  let finished = false;
  let completing = false;
  let deadline: Deadline | undefined;

  const stop = (failure: ResourceFailure): boolean => {
    if (terminal) return false;
    terminal = Object.freeze({ ...failure });
    if (!controller.signal.aborted) {
      const message = Str.truncate(failure.error, 160);
      controller.abort(Err.std(message, { name: 'HttpPullTerminal' }));
    }
    return true;
  };

  life.dispose$.subscribe(() => {
    if (!completing) stop(RESOURCE_FAILURE.cancelled);
  });
  if (life.disposed) stop(RESOURCE_FAILURE.cancelled);

  if (prepared.ok) {
    deadline = createDeadline(startedAt, prepared.policy.totalTimeout, () => {
      stop(RESOURCE_FAILURE.timeout);
    });
  }

  const settled = run()
    .catch(() => {
      stop(RESOURCE_FAILURE.execution);
    })
    .finally(() => {
      fillMissing();
      deadline?.cancel();
      try {
        ownedClient?.dispose('pull:complete');
      } catch {
        // Owned-client cleanup cannot rewrite committed or terminal resource evidence.
      } finally {
        finished = true;
        completing = true;
        if (!life.disposed) life.dispose('pull:complete');
        subject$.complete();
      }
    });

  const done: Promise<t.HttpPull.ResourceResult> = settled.then(() => {
    const ops = records as readonly t.HttpPull.ResourceRecord[];
    const totals: t.HttpPull.ResourceTotals = Object.freeze({
      resources: prepared.resourceCount,
      attempts: totalAttempts,
      transferredBytes,
      publishedBytes,
    });
    const ok = !terminal && ops.every((record) => record.ok);
    if (ok) {
      return Object.freeze({
        ok: true,
        ops: Object.freeze(ops) as readonly t.HttpPull.ResourceRecordSuccess[],
        totals,
      });
    }
    return Object.freeze({
      ok: false,
      ops: Object.freeze(ops),
      totals,
      ...(terminal ? { terminal: terminalEvidence(terminal) } : {}),
    });
  });

  async function run(): Promise<void> {
    await Schedule.micro();

    if (!prepared.ok) {
      prepared.records.forEach((record, index) => {
        records[index] = record;
        emitTerminal(record);
      });
      return;
    }

    if (deadline?.expired()) stop(RESOURCE_FAILURE.timeout);
    if (terminal) return;

    const admission = await admitResources(prepared.resources, prepared.rooted, controller.signal);
    if (terminal) return;
    if (!admission.ok) {
      stop(admission.failure);
      admission.records.forEach((record, index) => {
        records[index] = record;
        emitTerminal(record);
      });
      return;
    }

    admission.resources.forEach((resource, index) => {
      states[index].resource = resource;
    });
    if (admission.resources.length === 0 || terminal) return;

    ownedClient = makeClient({
      policy: prepared.policy.response,
      until: controller.signal,
      ...(prepared.headers ? { headers: prepared.headers } : {}),
    });

    await runWorkers(
      admission.resources,
      prepared.policy.concurrency,
      runResource,
      () => terminal !== undefined,
    );
  }

  async function runResource(resource: PreparedResource): Promise<void> {
    if (terminal) return;
    const state = states[resource.index];
    emit({
      kind: 'start',
      index: resource.index,
      total: states.length,
      url: resource.source.safe,
    });
    if (terminal) return;

    let record: t.HttpPull.ResourceRecord;
    try {
      record = await transferResource(resource, state, {
        client: ownedClient!,
        policy: authority!.policy,
        rooted: authority!.rooted,
        signal: controller.signal,
        resourceCount: states.length,
        stopped: () => terminal,
        startedAttempt: () => totalAttempts++,
        chargeBytes,
        emit,
      });
    } catch {
      if (terminal) return;
      record = resourceFailureRecord(resource, state, RESOURCE_FAILURE.execution);
    }

    if (records[resource.index]) return;
    if (terminal && !isCommittedResource(record)) return;
    records[resource.index] = record;
    if (record.ok) publishedBytes += record.bytes;
    emitTerminal(record);
  }

  function chargeBytes(state: ResourceState, delta: number): void {
    const policy = prepared.ok ? prepared.policy : undefined;
    if (!policy) return;
    if (delta > policy.maxTotalBytes - transferredBytes) {
      transferredBytes += delta;
      state.transferredBytes += delta;
      stop(RESOURCE_FAILURE.aggregate);
      throw Err.std('Aggregate byte limit exceeded', { name: 'HttpPullTerminal' });
    }
    transferredBytes += delta;
    state.transferredBytes += delta;
  }

  function fillMissing(): void {
    const failure = terminal ?? RESOURCE_FAILURE.execution;
    for (let index = 0; index < records.length; index++) {
      if (records[index]) continue;
      const state = states[index];
      const record = resourceFailureRecord(state.resource, state, failure);
      records[index] = record;
      emitTerminal(record);
    }
  }

  function emitTerminal(record: t.HttpPull.ResourceRecord): void {
    emit(
      record.ok
        ? {
          kind: 'done',
          index: record.index,
          total: states.length,
          url: record.path.source,
          record,
        }
        : {
          kind: 'error',
          index: record.index,
          total: states.length,
          url: record.path.source,
          record,
        },
    );
  }

  function emit(event: t.HttpPull.ResourceEvent.Any): void {
    if (!finished) subject$.next(event);
  }

  return {
    cancel: (reason?: unknown) => life.dispose(reason),
    done,
    events: (until?: t.UntilInput) => eventView(subject$, until),
  };
}

async function runWorkers(
  resources: readonly PreparedResource[],
  concurrency: number,
  run: (resource: PreparedResource) => Promise<void>,
  stopped: () => boolean,
): Promise<void> {
  let next = 0;
  const worker = async () => {
    while (!stopped()) {
      const index = next++;
      if (index >= resources.length) return;
      await run(resources[index]);
    }
  };
  const count = Num.clamp(0, concurrency, resources.length);
  await Promise.all(Array.from({ length: count }, worker));
}
