import { type t } from '../../-test.ts';
import { Files } from '../mod.ts';

/** Fixtures for Files.Authority tests. */
export const Fixture = {
  context,
  handlerMap,
} as const;

function handlerMap(calls: t.Files.Cmd.Name[]): t.Files.Cmd.HandlerMap {
  const file = { path: 'docs/readme.md', kind: 'file', size: 2 } as const;
  const capabilities = {
    list: true,
    stat: true,
    read: true,
    write: true,
    remove: true,
    watch: true,
    manifest: true,
  } satisfies t.Files.Capabilities;

  return {
    'files:capabilities': () => capabilities,
    'files:list': () => {
      calls.push('files:list');
      return { entries: [file] };
    },
    'files:stat': () => {
      calls.push('files:stat');
      return { entry: file };
    },
    'files:read': () => {
      calls.push('files:read');
      return { kind: 'inline', file, encoding: 'utf8', content: 'ok' };
    },
    'files:write': (payload) => {
      calls.push('files:write');
      return { kind: 'created', path: payload.path, entry: file };
    },
    'files:remove': (payload) => {
      calls.push('files:remove');
      return { kind: 'deleted', path: payload.path };
    },
    'files:watch': () => {
      calls.push('files:watch');
      return { ok: true };
    },
    'files:manifest': () => {
      calls.push('files:manifest');
      return { '.meta': { version: 'sys.files.manifest:v1', capabilities }, entries: [file] };
    },
  };
}

function context<K extends t.Files.Cmd.Name>(
  name: K,
): t.Cmd.Handler.Context<t.Files.Cmd.Name, t.Files.Cmd.Event, K> {
  return {
    id: 'req-files-authority-test' as t.Cmd.ReqId,
    name,
    ns: Files.Cmd.ns,
    signal: new AbortController().signal,
    emit() {
      throw new Error('Unexpected Files authority test event');
    },
  };
}
