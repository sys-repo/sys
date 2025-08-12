import { type t, Is } from './common.ts';
import { isWrapper } from './m.Yaml.u.ts';

export const from: t.IndexTreeYamlLib['from'] = (source, options) => {
  const infer = !!options?.inferPlainObjectsAsBranches;
  const rootPairs: Array<[string, t.YamlTreeSourceNode]> = Array.isArray(source)
    ? (source as ReadonlyArray<Record<string, t.YamlTreeSourceNode>>).map((o) => {
        const [k, v] = Object.entries(o)[0] as [string, t.YamlTreeSourceNode];
        return [k, v];
      })
    : Object.entries(source as Record<string, t.YamlTreeSourceNode>);

  /**
   * Implementation:
   */
  function makeNodes(
    k: string,
    v: t.YamlTreeSourceNode,
    path: readonly string[],
  ): readonly t.TreeNode[] {
    const seg = k;
    const nextPath = [...path, seg];
    const key = nextPath.join('/');

    // Wrapper path (explicit `.` or `children`):
    if (isWrapper(v)) {
      const meta = v['.'];
      const id = typeof meta?.id === 'string' ? (meta.id as string) : undefined;
      const rawLabel =
        meta && Object.prototype.hasOwnProperty.call(meta, 'label')
          ? (meta as any).label
          : undefined;
      const label = (rawLabel !== undefined ? (rawLabel as any) : k) as t.TreeNode['label'];
      const nodeKey = id ? [...path, id].join('/') : key;

      // Data payload = all non-reserved keys:
      const data: Record<string, unknown> = {};
      for (const [dk, dv] of Object.entries(v)) {
        if (dk !== '.' && dk !== 'children') data[dk] = dv;
      }
      const value = Object.keys(data).length > 0 ? data : undefined;

      // Children
      const childSpec = v.children;
      const childPath = id ? [...path, id] : nextPath;
      const children: t.TreeNodeList | undefined = (() => {
        if (!childSpec) return undefined;
        if (Array.isArray(childSpec)) {
          // ordered: array of single-entry maps.
          return childSpec.flatMap((m) => {
            const [ck, cv] = Object.entries(m)[0] as [string, t.YamlTreeSourceNode];
            return makeNodes(ck, cv, childPath);
          });
        } else {
          // record form (insertion order from YAML parser).
          return Object.entries(childSpec).flatMap(([ck, cv]) => makeNodes(ck, cv, childPath));
        }
      })();

      return [
        {
          key: nodeKey,
          label,
          ...(value !== undefined ? { value } : {}),
          ...(children ? { children } : {}),
          ...(meta ? { meta } : {}),
        },
      ] as const;
    }

    // Heuristic (opt-in): plain object → branch:
    if (infer && Is.record(v)) {
      const children = Object.entries(v).flatMap(([ck, cv]) => makeNodes(ck, cv, nextPath));
      return [{ key, label: k, children }] as const;
    }

    // Leaf (scalar | array | plain object payload):
    return [{ key, label: k, value: v }] as const;
  }

  // Finish up.
  return rootPairs.flatMap(([k, v]) => makeNodes(k, v, []));
};
