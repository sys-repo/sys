import type { t } from './common.ts';

export const Link: t.EditorLinkLib = {
  toLinkBounds({ model, range }) {
    const uri = model.uri;
    const start = { lineNumber: range.startLineNumber, column: range.startColumn };
    const end = { lineNumber: range.endLineNumber, column: range.endColumn };
    return {
      model: { uri },
      start,
      end,
      range,
      startOffset: model.getOffsetAt(start),
      endOffset: model.getOffsetAt(end),
    };
  },

  linkToBounds({ model, link }) {
    return Link.toLinkBounds({ model, range: link.range });
  },

  toRange(bounds) {
    const r = bounds.range;
    return {
      startLineNumber: r.startLineNumber,
      startColumn: r.startColumn,
      endLineNumber: r.endLineNumber,
      endColumn: r.endColumn,
    };
  },

  replace(editor, bounds, text: string): t.Monaco.Position {
    const model = editor.getModel?.();
    if (!model) return { lineNumber: 1, column: 1 } as t.Monaco.Position;

    if (model.uri.toString(true) !== bounds.model.uri.toString(true)) {
      return editor.getPosition?.() ?? ({ lineNumber: 1, column: 1 } as t.Monaco.Position);
    }

    editor.executeEdits('editor.link.replace', [
      { range: bounds.range, text, forceMoveMarkers: true },
    ]);
    const pos = model.getPositionAt(bounds.startOffset + text.length);
    editor.setPosition(pos);
    editor.revealPositionInCenterIfOutsideViewport?.(pos);
    return pos;
  },

  reveal(editor, bounds: t.EditorLinkBounds) {
    const model = editor.getModel?.();
    if (!model) return;
    if (model.uri.toString(true) !== bounds.model.uri.toString(true)) return;
    editor.revealRangeInCenterIfOutsideViewport?.(bounds.range);
  },
};
