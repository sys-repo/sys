import { HttpClient, Rx, type t } from '../common.ts';
import { isAbortError, makeEventQueue } from './u.ts';
import { preflightResources, pullResource } from './u.resource.ts';

/** Stream a checksum-bound resource batch through one Rooted capability. */
export function streamResources(
  resources: readonly t.HttpPull.Resource[],
  rooted: t.Fs.Rooted.Instance,
  options: t.HttpPull.ResourceOptions,
): t.HttpPull.Stream.Instance {
  let total = 0;
  const records: t.HttpPull.Record[] = [];
  const life = Rx.lifecycle(options.until);
  const controller = new AbortController();
  const signal = controller.signal;
  const queue = makeEventQueue<t.HttpPull.Event.Any>();
  const subject$ = Rx.subject<t.HttpPull.Event.Any>();
  let cancelled = false;
  let failed = false;

  life.dispose$.subscribe((reason) => {
    cancelled = true;
    controller.abort(reason);
    subject$.complete();
  });

  const settled = run().finally(() => {
    queue.close();
    if (!cancelled) subject$.complete();
  });

  async function run(): Promise<void> {
    const preflight = await preflightResources(resources, rooted, signal);
    if (!preflight.ok) {
      if (!signal.aborted) {
        failed = true;
        total = preflight.records.length;
        preflight.records.forEach((record, index) => {
          records.push(record);
          emit({
            kind: 'error',
            index: index as t.Index,
            total,
            url: record.path.source,
            record,
          });
        });
      }
      return;
    }

    total = preflight.resources.length;
    const client = HttpClient.fetcher({
      policy: options.policy,
      until: signal,
    });

    try {
      for (let index = 0; index < preflight.resources.length; index++) {
        if (signal.aborted) return;
        const resource = preflight.resources[index];
        const resourceIndex = index as t.Index;
        emit({
          kind: 'start',
          index: resourceIndex,
          total,
          url: resource.source.input,
        });

        try {
          const record = await pullResource(resource, rooted, client, { signal });
          if (signal.aborted) return;
          records.push(record);
          failed ||= !record.ok;
          emit(
            record.ok
              ? {
                kind: 'done',
                index: resourceIndex,
                total,
                url: resource.source.input,
                record,
              }
              : {
                kind: 'error',
                index: resourceIndex,
                total,
                url: resource.source.input,
                record,
              },
          );
        } catch (cause) {
          if (isAbortError(cause) || signal.aborted) return;
          failed = true;
          const record: t.HttpPull.RecordFailure = {
            ok: false,
            error: 'Secure pull execution failed',
            path: { source: resource.source.input, target: resource.target.path },
          };
          records.push(record);
          emit({
            kind: 'error',
            index: resourceIndex,
            total,
            url: resource.source.input,
            record,
          });
        }
      }
    } finally {
      client.dispose();
    }
  }

  function emit(event: t.HttpPull.Event.Any): void {
    if (signal.aborted) return;
    queue.push(event);
    subject$.next(event);
  }

  const done: Promise<t.HttpPull.ToDir.Result> = settled.then(() => {
    const ops = records as readonly t.HttpPull.Record[];
    const ok = !failed && ops.every((record) => record.ok);
    return { ok, ops } as t.HttpPull.ToDir.Result;
  });

  const iterator = async function* () {
    try {
      for await (const event of queue) {
        if (signal.aborted) break;
        yield event;
      }
    } finally {
      life.dispose();
      controller.abort('iterator:closed');
    }
  };

  return {
    [Symbol.asyncIterator]: () => iterator(),
    cancel: (reason?: unknown) => life.dispose(reason),
    done,
    events(until?: t.UntilInput) {
      const child = Rx.lifecycle([life, until]);
      child.dispose$.subscribe(() => subject$.complete());
      return Rx.toLifecycle<t.HttpPull.Stream.Events>(child, {
        $: subject$.asObservable(),
      });
    },
  };
}
