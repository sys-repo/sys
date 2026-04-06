import { type t } from './common.ts';
import { scanRuntimeGraph } from './u.runtimeGraph.ts';

export const runtimeGraphOwnership: t.EsmAssert.RuntimeGraph.Ownership = async (options) => {
  const graph = await scanRuntimeGraph({ entry: options.entry });

  for (const spec of options.ownedImports) {
    if (graph.imports.has(spec)) continue;
    const err = `EsmAssert.runtimeGraphOwnership: missing owned import '${spec}' in runtime graph from '${options.entry}'.`;
    throw new Error(err);
  }
};
