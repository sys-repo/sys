import { type t } from './common.ts';
import { wrangle } from './u.wrangle.ts';

export const build: t.EsmTopological.Lib['build'] = <T>(input: t.EsmTopological.Input<T>) => {
  const nodes = [...input.nodes].sort((a, b) => a.key.localeCompare(b.key));
  const duplicateKeys = wrangle.duplicates(nodes.map((node) => node.key));
  if (duplicateKeys.length > 0) {
    return { ok: false, invalid: { code: 'node:duplicate-key', keys: duplicateKeys } };
  }

  const nodeByKey = new Map(nodes.map((node) => [node.key, node] as const));
  const indegree = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  const after = new Map<string, Set<string>>();

  for (const node of nodes) {
    indegree.set(node.key, 0);
    outgoing.set(node.key, []);
    after.set(node.key, new Set());
  }

  const unknownEdgeKeys = wrangle.unknownEdgeKeys(input.edges, nodeByKey);
  if (unknownEdgeKeys.length > 0) {
    return { ok: false, invalid: { code: 'edge:unknown-node', keys: unknownEdgeKeys } };
  }

  for (const edge of input.edges) {
    outgoing.get(edge.from)!.push(edge.to);
    indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1);
    after.get(edge.to)!.add(edge.from);
  }

  const ready = nodes
    .filter((node) => (indegree.get(node.key) ?? 0) === 0)
    .map((node) => node.key)
    .sort((a, b) => a.localeCompare(b));

  const items: t.EsmTopological.Item<T>[] = [];

  while (ready.length > 0) {
    const key = ready.shift()!;
    const node = nodeByKey.get(key)!;
    items.push({
      node,
      index: items.length,
      after: [...(after.get(key) ?? [])].sort((a, b) => a.localeCompare(b)),
    });

    const deps = [...(outgoing.get(key) ?? [])].sort((a, b) => a.localeCompare(b));
    for (const to of deps) {
      const next = (indegree.get(to) ?? 0) - 1;
      indegree.set(to, next);
      if (next === 0) {
        ready.push(to);
        ready.sort((a, b) => a.localeCompare(b));
      }
    }
  }

  if (items.length === nodes.length) {
    return { ok: true, items };
  }

  const seen = new Set(items.map((item) => item.node.key));
  const keys = nodes
    .map((node) => node.key)
    .filter((key) => !seen.has(key))
    .sort((a, b) => a.localeCompare(b));

  return { ok: false, cycle: { keys } };
};
