import { useEffect, useState } from 'react';
import { type t, Immutable, Obj, Yaml } from './common.ts';
import { Path } from './m.Path.ts';

export const useYaml: t.UseEditorYaml = (args) => {
  const editor = args.editor;

  /**
   * Hooks:
   */
  const [, setCount] = useState(0);
  const [parser, setParser] = useState<t.YamlSyncParser>();
  const [cursor, setCursor] = useState<t.EditorYamlCursorPath>({ path: [] });

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
   * Effect: Cursor Path
   */
  useEffect(() => {
    if (!editor) return;
    const observer = Path.observe(editor);
    observer.$.subscribe((e) => setCursor(e));
    return observer.dispose;
  }, [editor?.getId()]);

  /**
   * API:
   */
  const api: t.EditorYamlHook = {
    ok: parser ? parser.errors.length === 0 : true,
    get editor() {
      return editor;
    },
    get doc() {
      return parser?.doc;
    },
    get path() {
      return parser?.path;
    },
    get cursor() {
      return cursor;
    },
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
