import { type t } from '../common.ts';

type O = Record<string, unknown>;

/**
 * Factory for a command-backed CRDT document loader:
 */
export function makeLoad(cmd: t.Crdt.Cmd.Client): t.Crdt.Graph.LoadDoc<O> {
  return async (id) => {
    const result = await cmd.send('doc:read', { doc: id });
    const current = result.value as O | undefined;
    if (!current) return undefined;
    return {
      get current() {
        return current;
      },
    };
  };
}
