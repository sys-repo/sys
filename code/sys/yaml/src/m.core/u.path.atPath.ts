import { isMap, isScalar, isSeq } from 'yaml';
import { type t } from './common.ts';

type NodeOrNil = t.Yaml.Node | null | undefined;

export const atPath: t.YamlPathLib['atPath'] = (ast, path) => {
  let node: NodeOrNil = ast.contents;

  for (const seg of path) {
    if (!node) return undefined;

    if (isMap(node)) {
      const keyStr = String(seg);
      let next: NodeOrNil;

      for (const pair of node.items as t.Yaml.Pair[]) {
        const k = pair.key;

        // Prefer scalar key value when present; otherwise fall back to toString.
        let kStr = '';
        if (k) {
          if (isScalar(k)) kStr = String((k as t.Yaml.Scalar).value);
          else if (typeof (k as any).toString === 'function') kStr = String((k as any).toString());
        }

        if (kStr === keyStr) {
          next = pair.value as NodeOrNil;
          break;
        }
      }

      node = next;
      continue;
    }

    if (isSeq(node)) {
      const idx = typeof seg === 'number' ? seg : Number(seg);
      if (!Number.isInteger(idx)) return undefined;
      node = (node.items as NodeOrNil[])[idx];
      continue;
    }

    // Scalar / unknown → cannot descend.
    return undefined;
  }

  return node ?? undefined;
};
