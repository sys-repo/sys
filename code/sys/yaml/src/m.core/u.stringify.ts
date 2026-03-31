import { type t, Err } from './common.ts';
import { Document } from 'yaml';
import { walk } from './u.walk.ts';

export function stringify<T>(value: T, options?: t.YamlStringifyOptions): t.YamlStringifyResult {
  try {
    const { format, ...yamlOptions } = options ?? {};
    const doc = new Document(value);

    if (format) {
      walk(doc as unknown as t.YamlAstDocument, (event) =>
        format({
          doc: doc as t.Yaml.Doc,
          parent: event.parent,
          node: event.node,
          path: event.path,
          key: event.key,
          stop: event.stop,
        })
      );
    }

    const yaml = doc.toString(yamlOptions) as t.StringYaml;
    return { data: yaml as t.StringYaml };
  } catch (err) {
    return { error: Err.std(err) };
  }
}
