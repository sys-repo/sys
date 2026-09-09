import { Str, type t } from './common.ts';

const compare = Str.Compare.codeUnit();

export const wrangle = Object.freeze({
  duplicates(keys: readonly string[]) {
    const seen = new Set<string>();
    const dup = new Set<string>();
    for (const key of keys) {
      if (seen.has(key)) dup.add(key);
      seen.add(key);
    }
    return [...dup].sort(compare);
  },

  cyclePath(edges: readonly t.EsmTopological.Edge[], keys: readonly string[]) {
    const allowed = new Set(keys);
    const outgoing = new Map(keys.map((key) => [key, [] as string[]] as const));

    for (const edge of edges) {
      if (!allowed.has(edge.from) || !allowed.has(edge.to)) continue;
      outgoing.get(edge.from)?.push(edge.to);
    }

    for (const [key, values] of outgoing) outgoing.set(key, [...new Set(values)].sort(compare));

    const visited = new Set<string>();
    const active = new Map<string, number>();
    const stack: string[] = [];

    const visit = (key: string): readonly string[] | undefined => {
      visited.add(key);
      active.set(key, stack.length);
      stack.push(key);

      for (const next of outgoing.get(key) ?? []) {
        const index = active.get(next);
        if (index !== undefined) return [...stack.slice(index), next];
        if (visited.has(next)) continue;
        const cycle = visit(next);
        if (cycle) return cycle;
      }

      stack.pop();
      active.delete(key);
      return undefined;
    };

    for (const key of keys) {
      if (visited.has(key)) continue;
      const cycle = visit(key);
      if (cycle) return cycle;
    }

    return keys.length > 0 ? [...keys, keys[0]] : [];
  },

  unknownEdgeKeys(
    edges: readonly t.EsmTopological.Edge[],
    nodeByKey: ReadonlyMap<string, t.EsmTopological.Node<unknown>>,
  ) {
    const unknown = new Set<string>();
    for (const edge of edges) {
      if (!nodeByKey.has(edge.from)) unknown.add(edge.from);
      if (!nodeByKey.has(edge.to)) unknown.add(edge.to);
    }
    return [...unknown].sort(compare);
  },
});
