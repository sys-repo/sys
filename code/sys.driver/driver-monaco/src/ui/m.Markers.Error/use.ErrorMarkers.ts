import { useEffect, useRef } from 'react';
import { type t, Error, slug } from './common.ts';

type D = t.Diagnostic;
type Pos = { line: number; col: number };
type ErrWithLinePos = D & { linePos: [Pos, Pos] };

/**
 * Adds (or clears) error markers in the Monaco editor for a set of diagnostics.
 */
export const useErrorMarkers: t.UseErrorMarkers = (args) => {
  const { monaco, editor, errors = [], enabled = true } = args;

  /**
   * Stable owner (latched once).
   */
  const ownerRef = useRef<string>(args.owner ?? slug());
  const owner = ownerRef.current;

  /**
   * Keep latest monaco/editor for unmount cleanup only
   * (avoids stale closures if these props change).
   */
  const monacoRef = useRef(monaco);
  const editorRef = useRef(editor);
  useEffect(() => {
    monacoRef.current = monaco;
    editorRef.current = editor;
  }, [monaco, editor]);

  /**
   * Cleanup on unmount: clear this owner's markers from the current model.
   */
  useEffect(() => {
    return () => {
      const model = editorRef.current?.getModel();
      if (model) monacoRef.current?.editor.setModelMarkers(model, owner, []);
    };
  }, [owner]);

  /**
   * Sync markers with the current diagnostics.
   */
  useEffect(() => {
    if (!monaco || !editor || !enabled) return;

    const model = editor.getModel();
    if (!model) return;

    if (errors.length === 0) {
      monaco.editor.setModelMarkers(model, owner, []);
      return;
    }

    const markers = Error.toMarkers(model, errors as t.Schema.Error[]);
    monaco.editor.setModelMarkers(model, owner, markers);
  }, [enabled, monaco, editor, errors, owner]);

  /**
   * Clear when disabled toggles false.
   */
  useEffect(() => {
    if (enabled) return;
    const model = editor?.getModel();
    if (model) monaco?.editor.setModelMarkers(model, owner, []);
  }, [enabled, monaco, editor, owner]);

  /**
   * Reapply on model swaps.
   */
  useEffect(() => {
    if (!editor || !monaco) return;
    const sub = editor.onDidChangeModel?.(() => {
      const model = editor.getModel();
      if (!model) return;
      const markers =
        enabled && errors.length ? Error.toMarkers(model, errors as t.Schema.Error[]) : [];
      monaco.editor.setModelMarkers(model, owner, markers);
    });
    return () => sub?.dispose();
  }, [editor, monaco, enabled, errors, owner]);
};
