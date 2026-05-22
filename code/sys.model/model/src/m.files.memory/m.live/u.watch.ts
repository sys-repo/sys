import { Files } from '../../m.files/mod.ts';
import { Glob, type t } from '../common.ts';
import {
  type ListEntriesOptions,
  snapshotListOptions,
  withinScope,
} from '../../m.files/u/u.list.ts';
import { type MemoryNodes } from '../u/u.index.ts';
import { entryFromNode, type MemoryNode } from '../u/u.node.ts';
import { absolutePath, invalidPath, path as pathOps, visiblePath } from '../u/u.path.ts';
import { fail } from '../u/u.error.ts';
import { allowed } from '../u/u.policy.ts';

type WatchContext = t.Cmd.Handler.Context<
  t.Files.Cmd.Name,
  t.Files.Cmd.Event,
  t.Files.Cmd.Name.Watch
>;

type Watcher = {
  readonly query: ListEntriesOptions;
  readonly context: WatchContext;
};

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
  ) => t.Files.Change;
};

/** Create live watch state and Cmd handler for an in-memory node graph. */
export const createWatch = (nodes: MemoryNodes, policy: t.Files.Policy.Shape): WatchRuntime => {
  const watchers = new Set<Watcher>();
  const activeWaiters = new Set<() => void>();
  let seq = 0;

  const diagnostics: t.Files.Live.Diagnostics = Object.freeze({
    Active: Object.freeze({
      watchCount() {
        return watchers.size;
      },
      whenActive() {
        if (watchers.size > 0) return Promise.resolve();
        return new Promise<void>((resolve) => activeWaiters.add(resolve));
      },
    }),
  });

  return Object.freeze({
    diagnostics,
    handler(payload, context) {
      const query = watchQuery(nodes, policy, payload);
      return new Promise<t.Files.Cmd.Watch.Result>((resolve) => {
        const watcher: Watcher = { query, context };
        const stop = () => {
          watchers.delete(watcher);
          context.signal.removeEventListener('abort', stop);
          resolve({ ok: true, cursor: Files.Cursor.create('watch', String(seq)) });
        };

        if (context.signal.aborted) {
          stop();
          return;
        }

        watchers.add(watcher);
        context.signal.addEventListener('abort', stop, { once: true });
        notifyActive();
      });
    },
    emit(kind, path, correlation) {
      const includeEntry = allowed(policy, 'stat', path);
      const node = includeEntry ? nodes.get(absolutePath(path)) : undefined;
      const change = changeFrom(kind, path, node, nextSeq(), correlation);

      for (const watcher of [...watchers]) {
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

  function nextSeq(): t.Files.Seq {
    seq += 1;
    return seq as t.Files.Seq;
  }

  function notifyActive() {
    for (const resolve of activeWaiters) resolve();
    activeWaiters.clear();
  }
};

function watchQuery(
  nodes: MemoryNodes,
  policy: t.Files.Policy.Shape,
  payload: t.Files.Cmd.Watch.Payload,
): ListEntriesOptions {
  const path = visiblePath(payload.path);
  const query = snapshotListOptions(
    {
      path,
      match: payload.match,
      exclude: payload.exclude,
    },
    invalidPath,
  );

  if (!allowed(policy, 'watch', query.path)) {
    throw fail('FilesMemoryError.PolicyDenied', `Watch denied: ${query.path}`);
  }

  const node = nodes.get(absolutePath(query.path));
  if (!node) throw fail('FilesMemoryError.NotFound', `Directory not found: ${query.path}`);
  if (node.kind !== 'dir') {
    throw fail('FilesMemoryError.NotDirectory', `Not a directory: ${query.path}`);
  }

  return query;
}

function watcherMatches(
  query: ListEntriesOptions,
  path: t.Files.String.Path,
  policy: t.Files.Policy.Shape,
): boolean {
  if (!withinScope(path, query.path, pathOps.relative)) return false;
  if (!allowed(policy, 'watch', path)) return false;
  if (query.match && !Glob.matches(query.match, path)) return false;
  if (query.exclude && Glob.matches(query.exclude, path)) return false;
  return true;
}

function changeFrom(
  kind: t.Files.Change['kind'],
  path: t.Files.String.Path,
  node: MemoryNode | undefined,
  seq: t.Files.Seq,
  correlation: t.Cmd.ReqId,
): t.Files.Change {
  return {
    kind,
    path,
    seq,
    origin: 'command',
    correlation,
    ...(kind === 'deleted' || node === undefined ? {} : { entry: entryFromNode(path, node) }),
  };
}
