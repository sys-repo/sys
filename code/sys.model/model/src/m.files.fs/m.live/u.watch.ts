import { Files } from '../../m.files/mod.ts';
import { type t } from '../common.ts';
import type * as TCapability from '../t/t.capability.ts';
import { fail } from '../u/u.error.ts';
import { realScope } from '../u/u.path.ts';
import { changesFromEvent, commandChange, watcherMatches } from './u.change.ts';
import { type WatchQuery, watchQuery, type WatchScope } from './u.query.ts';

type WatchContext = t.Cmd.Handler.Context<
  t.Files.Cmd.Name,
  t.Files.Cmd.Event,
  t.Files.Cmd.Name.Watch
>;

type WatchRuntime = {
  readonly diagnostics: t.Files.Live.Diagnostics;
  readonly handler: (
    payload: t.Files.Cmd.Watch.Payload,
    context: WatchContext,
  ) => Promise<t.Files.Cmd.Watch.Result>;
  readonly emit: (
    kind: t.Files.Change['kind'],
    path: t.Files.String.Path,
    correlation: t.Cmd.ReqId,
  ) => Promise<t.Files.Change>;
};

type ActiveWatch = {
  readonly query: WatchQuery;
  readonly context: WatchContext;
  readonly watcher: TCapability.Watcher;
  readonly subscription: TCapability.WatchSubscription;
};

/** Create live watch state and Cmd handler for a bounded filesystem scope. */
export const createWatch = (scope: WatchScope, policy: t.Files.Policy.Shape): WatchRuntime => {
  const active = new Set<ActiveWatch>();
  const activeWaiters = new Set<() => void>();
  let seq = 0;

  const diagnostics: t.Files.Live.Diagnostics = Object.freeze({
    Active: Object.freeze({
      watchCount() {
        return active.size;
      },
      whenActive() {
        if (active.size > 0) return Promise.resolve();
        return new Promise<void>((resolve) => activeWaiters.add(resolve));
      },
    }),
  });

  return Object.freeze({
    diagnostics,
    async handler(payload, context) {
      const query = await watchQuery(scope, policy, payload);
      if (context.signal.aborted) return { ok: true, cursor: cursor() };

      const watcher = await startWatcher(scope, query);
      if (!watcher.exists) {
        watcher.dispose();
        throw fail('FilesFsError.NotFound', `Directory not found: ${query.path}`);
      }
      if (watcher.error) {
        watcher.dispose();
        throw fail('FilesFsError.Unsupported', 'Filesystem watch failed');
      }

      return new Promise<t.Files.Cmd.Watch.Result>((resolve) => {
        let settled = false;
        const subscription = watcher.$.subscribe((event) => {
          void emitEvent(query, policy, event, context).catch(() => undefined);
        });
        const record: ActiveWatch = { query, context, watcher, subscription };
        const stop = () => {
          if (settled) return;
          settled = true;
          active.delete(record);
          subscription.unsubscribe();
          watcher.dispose();
          context.signal.removeEventListener('abort', stop);
          resolve({ ok: true, cursor: cursor() });
        };

        if (context.signal.aborted) {
          stop();
          return;
        }

        active.add(record);
        context.signal.addEventListener('abort', stop, { once: true });
        notifyActive();
      });
    },
    async emit(kind, path, correlation) {
      const canonical = await realScope(scope);
      const change = await commandChange(canonical, policy, kind, path, nextSeq(), correlation);

      for (const watcher of [...active]) {
        if (!watcherMatches(watcher.query, change.path, policy)) continue;
        try {
          watcher.context.emit(change);
        } catch {
          // Watch events are hints; subscriber failure must not poison the mutation.
        }
      }

      return change;
    },
  });

  async function emitEvent(
    query: WatchQuery,
    policy: t.Files.Policy.Shape,
    event: TCapability.WatchEvent,
    context: WatchContext,
  ) {
    const changes = await changesFromEvent(query, policy, event, nextSeq);
    for (const change of changes) {
      try {
        context.emit(change);
      } catch {
        // Watch events are hints; subscriber failure must not poison the watch projection.
      }
    }
  }

  function nextSeq(): t.Files.Seq {
    seq += 1;
    return seq as t.Files.Seq;
  }

  function cursor(): t.Files.Cursor.Watch {
    return Files.Cursor.create('watch', String(seq));
  }

  function notifyActive() {
    for (const resolve of activeWaiters) resolve();
    activeWaiters.clear();
  }
};

async function startWatcher(
  scope: WatchScope,
  query: WatchQuery,
): Promise<TCapability.Watcher> {
  try {
    return await scope.fs.watch(query.real, { recursive: true });
  } catch {
    throw fail('FilesFsError.Unsupported', 'Filesystem watch failed');
  }
}
