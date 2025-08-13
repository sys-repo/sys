import { useCallback, useEffect, useState } from 'react';

import { type t, Immutable, Obj, Yaml } from './common.ts';
import { Path } from './m.Path.ts';
import { useErrorMarkers } from './use.ErrorMarkers.ts';
import { usePathLinks } from './use.PathLinks.ts';

export const useYaml: t.UseEditorYaml = (args, cb) => {
  const { monaco, editor, doc, path, debounce } = args;

  const fireChange = useCallback(() => {
    setCount((n) => n + 1);
    cb?.(api);
  }, [cb]);

  /**
   * Hooks:
   */
  const [, setCount] = useState(0);
  const [cursor, setCursor] = useState<t.EditorYamlCursorPath>({ path: [] });
  const [parser, setParser] = useState<t.YamlSyncParser>();
  usePathLinks({ editor, cursor });

  /** YAML parsing diagnostics: */
  useErrorMarkers({
    enabled: args.errorMarkers ?? false, // NB: opt-in.
    errors: parser?.errors,
    monaco,
    editor,
  });

  /**
   * Effect: YAML parsing.
   */
  useEffect(() => {
    if (!doc || !path) return void setParser(undefined);

    const syncer = Yaml.syncer({ doc, path, debounce });
    syncer.$.subscribe(fireChange);
    setParser(syncer);

    return syncer.dispose;
  }, [Obj.hash([...wrangle.docDeps(doc), path, debounce])]);

  /**
   * Effect: Cursor path.
   */
  useEffect(() => {
    if (!editor || !monaco) return;
    const observer = Path.observe(editor);
    observer.$.subscribe((e) => {
      setCursor(e);
      fireChange();
    });
    return observer.dispose;
  }, [editor?.getId(), !!monaco]);

  /**
   * API:
   */
  const api: t.EditorYaml = {
    get ok() {
      const errors = parser?.errors.length ?? 0;
      return errors === 0;
    },
    get path() {
      return parser?.path;
    },
    get cursor() {
      return cursor;
    },
    get parsed() {
      return {
        input: parser?.current.input ?? '',
        output: parser?.current.output ?? undefined,
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
