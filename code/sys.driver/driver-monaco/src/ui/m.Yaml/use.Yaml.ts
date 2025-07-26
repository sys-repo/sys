import { useEffect, useState } from 'react';
import { type t, Immutable, Obj, Yaml } from './common.ts';

export const useYaml: t.UseEditorYaml = (args) => {
  /**
   * Hooks:
   */
  const [, setCount] = useState(0);
  const [parser, setParser] = useState<t.YamlSyncParser>();

  /**
   * Effect: YAML parsing.
   */
  useEffect(() => {
    if (!args.doc || !args.path) return void setParser(undefined);

    const syncer = Yaml.syncer({ doc: args.doc, path: args.path, debounce: args.debounce });
    syncer.$.subscribe((e) => setCount((n) => n + 1));
    setParser(syncer);

    return syncer.dispose;
  }, [Obj.hash([...wrangle.docDeps(args.doc), args.path, args.debounce])]);

  /**
   * API:
   */
  const api: t.EditorYamlHook = {
    ok: parser ? parser.errors.length === 0 : true,
    doc: parser?.doc,
    path: parser?.path,
    get parsed() {
      return {
        input: parser?.current.yaml() ?? '',
        output: parser?.current.parsed() ?? undefined,
        errors: parser?.errors ?? [],
      };
    },
  };
  return api;
};

/**
 * Helpers:
 */
const wrangle = {
  docDeps(input: t.UseEditorYamlArgs['doc']) {
    if (!input) return [];
    if (Immutable.Is.immutableRef(input)) return [input.instance];
    return [input.source?.instance, input.target?.instance];
  },
} as const;
