import { useEffect, useRef } from 'react';
import { type t, slug } from './common.ts';

type Pos = { line: number; col: number };
type ErrWithLinePos = t.YamlError & { linePos: [Pos, Pos] };

/**
 * Adds (or clears) red-squiggly-error underlines
 * in the editor for the given set of YAML errors.
 */
export const useErrorMarkers: t.UseYamlErrorMarkers = (args) => {
  const { monaco, editor, errors = [], enabled = true } = args;

  /**
   * Stable owner (latched once).
   */
  const ownerRef = useRef<string>(args.owner ?? slug());
  const owner = ownerRef.current;

  /**
   * Keep latest monaco/editor for unmount cleanup only.
   * (Avoids stale closures if these props change.)
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
      const m = editorRef.current?.getModel();
      if (m) monacoRef.current?.editor.setModelMarkers(m, owner, []);
    };
  }, [owner]);

  /**
   * Sync markers with the current error list.
   */
  useEffect(() => {
    if (!monaco || !editor || !enabled) return;

    const model = editor.getModel();
    if (!model) return;

    if (errors.length === 0) {
      monaco.editor.setModelMarkers(model, owner, []);
      return;
    }

    const markers = errors.map((err) => wrangle.marker(monaco, model, err));
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
   *    Re-registers when enabled/errors/owner/monaco/editor change
   *    so the handler always uses current values.
   */
  useEffect(() => {
    if (!editor || !monaco) return;
    const sub = editor.onDidChangeModel?.(() => {
      const model = editor.getModel();
      if (!model) return;
      const markers =
        enabled && errors.length ? errors.map((e) => wrangle.marker(monaco, model, e)) : [];
      monaco.editor.setModelMarkers(model, owner, markers);
    });
    return () => sub?.dispose();
  }, [editor, monaco, enabled, errors, owner]);
};

/**
 * Helpers:
 */
function hasLinePos(e: t.YamlError): e is ErrWithLinePos {
  return Array.isArray(e.linePos) && e.linePos.length === 2;
}

const wrangle = {
  marker(
    monaco: t.Monaco.Monaco,
    model: t.Monaco.TextModel,
    err: t.YamlError,
  ): t.Monaco.I.IMarkerData {
    let range: t.Monaco.I.IRange;

    // 1) Best case: line/col tuples from the parser.
    if (hasLinePos(err)) {
      const start = err.linePos[0] as Pos;
      const end = err.linePos[1] as Pos;
      range = {
        startLineNumber: start.line,
        startColumn: start.col,
        endLineNumber: end.line,
        endColumn: end.col,
      };
    }
    // 2) Fallback: raw character offsets.
    else if (err.pos?.[0] !== undefined) {
      const start = model.getPositionAt(err.pos[0]);
      const end = model.getPositionAt(err.pos[1] ?? err.pos[0]);
      range = {
        startLineNumber: start.lineNumber,
        startColumn: start.column,
        endLineNumber: end.lineNumber,
        endColumn: end.column,
      };
    }
    // 3) Last-ditch default.
    else {
      range = { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 };
    }

    return {
      ...range,
      message: err.message,
      code: err.code,
      source: 'yaml',
      severity: monaco.MarkerSeverity.Error,
    };
  },
} as const;
