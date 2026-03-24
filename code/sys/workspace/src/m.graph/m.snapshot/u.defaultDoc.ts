import { type t } from './common.ts';
import { meta } from './u.meta.ts';

export function defaultDoc(): t.WorkspaceGraph.Snapshot.Doc {
  return {
    '.meta': meta({
      // `JsonFile.get()` treats zero as an unset sentinel and normalizes it
      // to `Time.now.timestamp` when the document seed is materialized.
      createdAt: 0,
      graphHash: '',
    }),
    graph: {
      orderedPaths: [],
      edges: [],
    },
  };
}
