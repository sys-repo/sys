import { Glob, type t } from '../common.ts';
import { withinScope } from '../../m.files/u/u.list.ts';
import type * as TCapability from '../t/t.capability.ts';
import { entryFromStat } from '../u/u.entry.ts';
import { allowed } from '../u/u.policy.ts';
import { absolutePath, assertInsideRealScope, relativePath } from '../u/u.path.ts';
import { type WatchQuery, type WatchScope } from './u.query.ts';

type NextSeq = () => t.Files.Seq;

/** Build a command-origin change hint from current filesystem truth. */
export const commandChange = async (
  scope: WatchScope,
  policy: t.Files.Policy.Shape,
  kind: t.Files.Change['kind'],
  path: t.Files.String.Path,
  seq: t.Files.Seq,
  correlation: t.Cmd.ReqId,
): Promise<t.Files.Change> => {
  const entry = kind === 'deleted' || !allowed(policy, 'stat', path)
    ? undefined
    : await statEntry(scope, path);

  return {
    kind,
    path,
    seq,
    origin: 'command',
    correlation,
    ...(entry === undefined ? {} : { entry }),
  };
};

/** Project a structural filesystem watch event into Files change hints. */
export const changesFromEvent = async (
  query: WatchQuery,
  policy: t.Files.Policy.Shape,
  event: TCapability.WatchEvent,
  nextSeq: NextSeq,
): Promise<readonly t.Files.Change[]> => {
  const changes: t.Files.Change[] = [];

  for (const input of event.paths) {
    const path = await visibleEventPath(query, input);
    if (!path) continue;
    if (!watcherMatches(query, path, policy)) continue;

    const kind = await changeKind(query, path, event.kind);
    if (!kind) continue;

    changes.push(await changeFrom(query, policy, kind, path, nextSeq()));
  }

  return changes;
};

async function visibleEventPath(
  query: WatchQuery,
  input: t.StringPath,
): Promise<t.Files.String.Path | undefined> {
  try {
    const absolute = query.scope.fs.Path.Is.absolute(input)
      ? input
      : query.scope.fs.Path.resolve(query.real, input);
    const real = await assertInsideRealScope(query.scope, absolute);
    const visible = real ?? absolute;
    return relativePath(query.scope, visible);
  } catch {
    return undefined;
  }
}

export function watcherMatches(
  query: WatchQuery,
  path: t.Files.String.Path,
  policy: t.Files.Policy.Shape,
): boolean {
  if (!withinScope(path, query.path, query.scope.fs.Path.relative)) return false;
  if (!allowed(policy, 'watch', path)) return false;
  if (query.match && !Glob.matches(query.match, path)) return false;
  if (query.exclude && Glob.matches(query.exclude, path)) return false;
  return true;
}

async function changeKind(
  query: WatchQuery,
  path: t.Files.String.Path,
  kind: TCapability.WatchEventKind,
): Promise<t.Files.Change['kind'] | undefined> {
  if (kind === 'create') return 'created';
  if (kind === 'modify') return 'modified';
  if (kind === 'remove') return 'deleted';
  if (kind === 'access') return undefined;

  const absolute = absolutePath(query.scope, path);
  const real = await assertInsideRealScope(query.scope, absolute);
  return real ? 'modified' : 'deleted';
}

async function changeFrom(
  query: WatchQuery,
  policy: t.Files.Policy.Shape,
  kind: t.Files.Change['kind'],
  path: t.Files.String.Path,
  seq: t.Files.Seq,
): Promise<t.Files.Change> {
  const entry = kind === 'deleted' || !allowed(policy, 'stat', path)
    ? undefined
    : await statEntry(query.scope, path);

  return {
    kind,
    path,
    seq,
    origin: 'fs-watch',
    ...(entry === undefined ? {} : { entry }),
  };
}

export async function statEntry(
  scope: WatchScope,
  path: t.Files.String.Path,
): Promise<t.Files.Entry | undefined> {
  const absolute = absolutePath(scope, path);
  const real = await assertInsideRealScope(scope, absolute);
  if (!real) return undefined;
  const info = await scope.fs.stat(real);
  return info ? entryFromStat(path, info) : undefined;
}
