import type { t } from './common.ts';

export const Link: t.EditorLinkLib = {
  toLinkBounds: ({ model, range }) => {
    const start = { lineNumber: range.startLineNumber, column: range.startColumn };
    const end = { lineNumber: range.endLineNumber, column: range.endColumn };
    return {
      modelUri: model.uri,
      start,
      end,
      range,
      startOffset: model.getOffsetAt(start),
      endOffset: model.getOffsetAt(end),
    };
  },

  linkToBounds: ({ model, link }) => {
    return Link.toLinkBounds({ model, range: link.range });
  },

  toRange: (bounds) => {
    const r = bounds.range;
    return {
      startLineNumber: r.startLineNumber,
      startColumn: r.startColumn,
      endLineNumber: r.endLineNumber,
      endColumn: r.endColumn,
    };
  },
};
