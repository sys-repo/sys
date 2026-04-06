import { type t, Fs } from './common.ts';
import { scanRuntimeGraph } from './u.runtimeGraph.ts';

export const runtimeGraphBoundary: t.EsmAssert.RuntimeGraph.Boundary = async (options) => {
  const graph = await scanRuntimeGraph({ entry: options.entry });
  const forbiddenImports = new Set(options.forbiddenImports ?? []);
  const forbiddenPathIncludes = options.forbiddenPathIncludes ?? [];

  for (const current of graph.files) {
    const text = await Fs.readText(current);
    if (!text.ok) {
      const err = `EsmAssert.runtimeGraphBoundary: failed to read '${current}'.`;
      throw new Error(err);
    }
    const src = text.data ?? '';
    for (const spec of forbiddenImports) {
      if (src.includes(spec)) {
        const err = `EsmAssert.runtimeGraphBoundary: forbidden import '${spec}' found in '${current}'.`;
        throw new Error(err);
      }
    }
  }

  for (const spec of forbiddenImports) {
    if (graph.imports.has(spec)) {
      const err = `EsmAssert.runtimeGraphBoundary: forbidden import '${spec}' found in runtime graph from '${options.entry}'.`;
      throw new Error(err);
    }
  }

  for (const current of graph.files) {
    for (const pattern of forbiddenPathIncludes) {
      if (current.includes(pattern)) {
        const err = `EsmAssert.runtimeGraphBoundary: forbidden path '${pattern}' reached at '${current}'.`;
        throw new Error(err);
      }
    }
  }
};
