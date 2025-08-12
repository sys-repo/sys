import { type t, Is } from './common.ts';

export const Yaml: t.IndexTreeYamlLib = {
  from(
    source: Record<string, t.YamlTreeSourceNode>,
    options?: { inferPlainObjectsAsBranches?: boolean },
  ): t.TreeNodeList {
    const infer = !!options?.inferPlainObjectsAsBranches;

    const makeNodes = (
      k: string,
      v: t.YamlTreeSourceNode,
      path: readonly string[],
    ): readonly t.TreeNode[] => {
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
    };

    return Object.entries(source).flatMap(([k, v]) => makeNodes(k, v, []));
  },

  at(root: t.TreeNodeList, path: t.ObjectPath): t.TreeNodeList {
    const parts = toPathParts(path);
    if (parts.length === 0) return root;

    let list: t.TreeNodeList = root;
    for (const seg of parts) {
      const next = list.find((n) => {
        const tail = lastSeg(n.key);
        const id = typeof n.meta?.id === 'string' ? (n.meta.id as string) : undefined;
        return seg === tail || (id && seg === id);
      });
      if (!next || !next.children) return [];
      list = next.children;
    }
    return list;
  },

  find(
    root: t.TreeNodeList,
    keyOr: string | ((args: { node: t.TreeNode; parents: readonly t.TreeNode[] }) => boolean),
  ): t.TreeNode | undefined {
    const pred =
      typeof keyOr === 'string' ? ({ node }: { node: t.TreeNode }) => node.key === keyOr : keyOr;

    const visit = (
      list: t.TreeNodeList,
      parents: readonly t.TreeNode[],
    ): t.TreeNode | undefined => {
      for (const node of list) {
        if (pred({ node, parents })) return node;
        if (node.children) {
          const hit = visit(node.children, [...parents, node]);
          if (hit) return hit;
        }
      }
      return undefined;
    };

    return visit(root, []);
  },
};

/**
 * Helpers:
 */
function isWrapper(v: unknown): v is t.YamlTreeSourceWrapper {
  return (
    Is.record(v) &&
    (Object.prototype.hasOwnProperty.call(v, '.') ||
      Object.prototype.hasOwnProperty.call(v, 'children'))
  );
}

function toPathParts(path: t.ObjectPath): string[] {
  return path.map((p) => String(p));
}

function lastSeg(key: string) {
  const i = key.lastIndexOf('/');
  return i >= 0 ? key.slice(i + 1) : key;
}
