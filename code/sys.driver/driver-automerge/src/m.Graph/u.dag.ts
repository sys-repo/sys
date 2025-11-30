import { type t, Graph } from './common.ts';
import { defaultDiscoverRefs } from './u.defaultDiscoverRefs.ts';
import { getWithRetry } from './u.getWithRetry.ts';

type O = Record<string, unknown>;

export const dag: t.CrdtGraphDag = async <T extends O>(args: t.CrdtGraphDagArgs<T>) =>
  Graph.dag<T>({
    ...(args as t.Graph.Dag.BuildArgs<T>),
    discoverRefs: args.discoverRefs ?? defaultDiscoverRefs,
    async load(id) {
      if ('load' in args) return args.load(id);
      if ('repo' in args) {
        const { ok, doc } = await getWithRetry<T>(args.repo, id);
        return ok ? doc : undefined;
      }
      return undefined;
    },
  });
