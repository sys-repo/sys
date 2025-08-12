import { type t, Is, Obj } from './common.ts';
import { isWrapper } from './m.Yaml.u.ts';

/**
 * Normalize a YAML-dialect object/sequence into a stable, ordered `TreeNodeList`.
 */
export const from: t.IndexTreeYamlLib['from'] = (source, options) => {
  const infer = !!options?.inferPlainObjectsAsBranches;

  // Root may be a mapping or a sequence of single-entry maps.
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
    parentPath: t.ObjectPath,
  ): readonly t.TreeNode[] {
    // Wrapper path (explicit `.` or `children`):
    if (isWrapper(v)) {
      const meta = v['.'];

      const id = typeof meta?.id === 'string' ? (meta.id as string) : undefined;
      const seg = id ?? k;

      const path = [...parentPath, seg] as t.ObjectPath;
      const key = Obj.Path.codec.encode(path);

      const rawLabel =
        meta && Object.prototype.hasOwnProperty.call(meta, 'label')
          ? (meta as any).label
          : undefined;
      const label = (rawLabel !== undefined ? (rawLabel as any) : k) as t.TreeNode['label'];

      // Data payload = all non-reserved keys:
      const data: Record<string, unknown> = {};
      for (const [dk, dv] of Object.entries(v)) {
        if (dk !== '.' && dk !== 'children') data[dk] = dv;
      }
      const value = Object.keys(data).length > 0 ? data : undefined;

      // Children:
      const childSpec = v.children;
      const childPath = path; // children inherit this node's path
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
          path,
          key,
          label,
          ...(value !== undefined ? { value } : {}),
          ...(children ? { children } : {}),
          ...(meta ? { meta } : {}),
        },
      ] as const;
    }

    // Heuristic (opt-in): plain object → branch:
    if (infer && Is.record(v)) {
      const seg = k;
      const path = [...parentPath, seg] as t.ObjectPath;
      const key = Obj.Path.codec.encode(path);
      const children = Object.entries(v).flatMap(([ck, cv]) => makeNodes(ck, cv, path));
      return [{ path, key, label: k, children }] as const;
    }

    // Leaf (scalar | array | plain object payload):
    {
      const seg = k;
      const path = [...parentPath, seg] as t.ObjectPath;
      const key = Obj.Path.codec.encode(path);
      return [{ path, key, label: k, value: v }] as const;
    }
  }

  // Finish up.
  return rootPairs.flatMap(([k, v]) => makeNodes(k, v, []));
};
