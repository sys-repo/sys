import * as Y from 'yaml';

import { type t, Is } from './common.ts';
import { YamlIs } from './m.Is.ts';

export const toJS: t.YamlLib['toJS'] = (input) => {
  try {
    const data =
      input instanceof Y.Document
        ? /**
           * Full Document (YamlAst): delegate to upstream .toJS(),
           * preserving existing alias/error semantics.
           */
          (input as Y.Document.Parsed).toJS()
        : /**
           * AST node (Scalar / Map / Seq / Alias):
           * use our own converter, which never throws.
           */
          nodeToJs(input as t.Yaml.Node);

    return {
      ok: true as const,
      data,
      errors: [] as t.YamlDiagnostic[],
    };
  } catch (err) {
    const msg = String((err as any)?.message ?? 'YAML toJS error');
    const code = /alias/i.test(msg) ? 'yaml.alias.unresolved' : 'yaml.tojs.error';
    const diag: t.YamlDiagnostic = { message: msg, code };
    return { ok: false, errors: [diag] };
  }
};

/**
 * Internal: convert a YAML AST node to a plain JS value.
 * - Handles Scalar / Map / Seq.
 * - Never throws (alias/unknown → `undefined`).
 */
const nodeToJs = (node: t.Yaml.Node): unknown => {
  if (YamlIs.scalar(node)) {
    return (node as Y.Scalar).value;
  }

  if (YamlIs.seq(node)) {
    const seq = node as t.Yaml.Seq;
    return seq.items.map((item) => (item && Is.object(item) ? nodeToJs(item) : item));
  }

  if (YamlIs.map(node)) {
    const map = node as t.Yaml.Map;
    const obj: Record<string, unknown> = {};

    for (const pair of map.items) {
      const keyNode = pair.key;
      const valueNode = pair.value;

      let key: string | number | undefined;
      if (YamlIs.scalar(keyNode)) key = keyNode.value as string | number | undefined;
      if (key === undefined) continue;

      const value = valueNode && typeof valueNode === 'object' ? nodeToJs(valueNode) : valueNode;
      obj[String(key)] = value;
    }

    return obj;
  }

  // Alias or unknown node types: treat as undefined.
  return undefined;
};
