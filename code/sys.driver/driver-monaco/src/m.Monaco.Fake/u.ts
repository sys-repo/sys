import { type t, Is } from './common.ts';
import { fakeEditor } from './m.Fake.editor.ts';
import { fakeModel } from './m.Fake.model.ts';
import { fakeMonaco } from './m.Fake.monaco.ts';

export function makePosition(lineNumber: number, column: number): t.Monaco.Position {
  const api = {
    lineNumber,
    column,

    with(ln: number = lineNumber, col: number = column): t.Monaco.Position {
      return makePosition(ln, col);
    },

    delta(dLine: number = 0, dCol: number = 0): t.Monaco.Position {
      return makePosition(lineNumber + dLine, column + dCol);
    },

    equals(other: { lineNumber: number; column: number }): boolean {
      return other?.lineNumber === lineNumber && other?.column === column;
    },

    isBefore(other: { lineNumber: number; column: number }): boolean {
      return (
        lineNumber < other.lineNumber || (lineNumber === other.lineNumber && column < other.column)
      );
    },

    isBeforeOrEqual(other: { lineNumber: number; column: number }): boolean {
      return this.isBefore(other) || this.equals(other);
    },

    isAfter(other: { lineNumber: number; column: number }): boolean {
      return (
        lineNumber > other.lineNumber || (lineNumber === other.lineNumber && column > other.column)
      );
    },

    isAfterOrEqual(other: { lineNumber: number; column: number }): boolean {
      return this.isAfter(other) || this.equals(other);
    },
  };

  // Structural match to Monaco.Position
  return api as unknown as t.Monaco.Position;
}

export const host: t.FakeMonacoLib['host'] = (modelInput?, monaco = fakeMonaco()) => {
  const model = Is.string(modelInput) ? fakeModel(modelInput) : modelInput ?? fakeModel('');
  const editor = fakeEditor(model);
  return {
    monaco: monaco as unknown as t.Monaco.Monaco,
    editor,
  };
};
