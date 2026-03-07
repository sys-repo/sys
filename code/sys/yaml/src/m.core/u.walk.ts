import type * as Y from 'yaml';
import { type t } from './common.ts';
import { YamlIs } from './m.Is.ts';

export const walk: t.YamlAstWalk = (doc, fn) => {
  let stopped = false;
  const stop = () => (stopped = true);

  const visitNode = (
    node: t.YamlAstNode,
    parent: t.YamlAstParent | undefined,
    path: t.ObjectPath,
    key: string | number | null,
  ): void => {
    if (stopped) return;

    const event: t.YamlAstWalkEvent = {
      doc,
      parent,
      node,
      path,
      key,
      stop,
    };

    fn(event);
    if (stopped) return;

    // Descend based on YAML node kind (Map / Seq).
    if (YamlIs.map(node)) {
      for (const pair of node.items) {
        const keyNode = pair.key;

        let fieldKey: string | null = null;
        if (YamlIs.scalar(keyNode) && typeof keyNode.value === 'string') {
          fieldKey = keyNode.value;
        }

        const valueNode = pair.value;
        if (!valueNode) continue;

        const nextPath: t.ObjectPath = fieldKey !== null ? [...path, fieldKey] : path;

        visitNode(valueNode as t.YamlAstNode, node, nextPath, fieldKey);
      }
      return;
    }

    if (YamlIs.seq(node)) {
      node.items.forEach((item, index) => {
        if (!item) return;
        const nextPath: t.ObjectPath = [...path, index];
        visitNode(item as t.YamlAstNode, node, nextPath, index);
      });
      return;
    }

    // Scalars / aliases are leaves (no recursion).
  };

  // const contents = (doc as Y.Document<t.Yaml.Node>).contents;
  const contents = (doc as t.Yaml.Doc<t.Yaml.Node>).contents;

  if (Array.isArray(contents)) {
    for (const node of contents) {
      if (!node) continue;
      const path: t.ObjectPath = [];
      visitNode(node as t.YamlAstNode, doc, path, null);
      if (stopped) break;
    }
  } else if (contents) {
    const path: t.ObjectPath = [];
    visitNode(contents as t.YamlAstNode, doc, path, null);
  }
};
