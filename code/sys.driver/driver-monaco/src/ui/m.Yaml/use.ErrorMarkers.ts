import { useEffect } from 'react';
import { type t } from './common.ts';

/**
 * Adds (or clears) red-squiggly-error underlines
 * in the editor for the given set of YAML errors.
 */
export const useErrorMarkers: t.UseYamlErrorMarkers = (args) => {
  const { monaco, editor, errors = [], enabled = true } = args;
  const owner = 'yaml';

  /**
   * Effect: sync editor with error list.
   */
  useEffect(() => {
    if (!monaco || !editor || !enabled) return;

    const model = editor.getModel();
    if (!model) return;

    // Clear when the document is clean:
    if (errors.length === 0) {
      monaco.editor.setModelMarkers(model, owner, []);
      return;
    }

    // Assign error markers to the editor:
    const marker = (err: t.YamlError) => wrangle.marker(monaco, model, err);
    const markers = errors.map((err) => marker(err));
    monaco.editor.setModelMarkers(model, owner, markers);
  }, [enabled, monaco, editor, errors]);

  /**
   * Effect: clear on disabled
   */
  useEffect(() => {
    if (enabled) return;
    const model = editor?.getModel();
    if (model) monaco?.editor.setModelMarkers(model, owner, []);
  }, [enabled, monaco]);
};

/**
 * Helpers:
 */
type Pos = { line: number; col: number };
type ErrWithLinePos = t.YamlError & { linePos: [Pos, Pos] };
const hasLinePos = (e: t.YamlError): e is ErrWithLinePos => {
  return Array.isArray(e.linePos) && e.linePos.length === 2;
};

const wrangle = {
  marker(
    monaco: t.Monaco.Monaco,
    model: t.Monaco.TextModel,
    err: t.YamlError,
  ): t.Monaco.I.IMarkerData {
    let range: t.Monaco.I.IRange;

    // 1. The parser gave start-/end line/col tuples (best case):
    if (hasLinePos(err)) {
      const start = err.linePos[0]; // { line: number; col: number }
      const end = err.linePos[1];

      range = {
        startLineNumber: start.line,
        startColumn: start.col,
        endLineNumber: end.line,
        endColumn: end.col,
      };
    }
    // 2. Fallback: raw character offsets:
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
    // 3. Last-ditch default (top-left):
    else {
      range = { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 };
    }

    // Build marker:
    return {
      ...range,
      message: err.message,
      code: err.code,
      source: 'yaml',
      severity: monaco.MarkerSeverity.Error,
    };
  },
} as const;
