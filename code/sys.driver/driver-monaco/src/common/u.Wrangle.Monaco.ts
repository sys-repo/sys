import type * as t from './t.ts';

/**
 * Helpers that require the full Monaco API.
 */
export const Monaco = {
  offsets(monaco: t.Monaco, editor: t.MonacoCodeEditor, selection: t.ISelection) {
    const { Range } = monaco;
    const model = editor.getModel();
    if (!model) throw new Error(`Editor did not return a text model.`);

    const position = Monaco.position(monaco, selection);
    const range = Range.fromPositions(position.start, position.end);

    return {
      start: model.getOffsetAt(range.getStartPosition()),
      end: model.getOffsetAt(range.getEndPosition()),
    };
  },

  position(monaco: t.Monaco, selection: t.ISelection) {
    const { Position } = monaco;
    const { selectionStartLineNumber, selectionStartColumn } = selection;
    const { positionLineNumber, positionColumn } = selection;
    return {
      start: new Position(selectionStartLineNumber, selectionStartColumn),
      end: new Position(positionLineNumber, positionColumn),
    };
  },
} as const;
