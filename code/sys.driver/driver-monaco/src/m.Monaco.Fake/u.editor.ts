import { type t } from './common.ts';
import { fakeModel } from './u.model.ts';

type Range = t.Monaco.IRange;

/**
 * Minimal `IStandaloneCodeEditor` fake.
 */
export const fakeEditor: t.FakeMonacoLib['editor'] = (input) => {
  const model = wrangle.model(input);
  let position: t.Offset = { lineNumber: 1, column: 1 };
  const cursorSubs: Array<(e: t.Monaco.ICursorPositionChangedEvent) => void> = [];

  /**
   * Code Folding:
   */
  let hiddenAreas: Range[] = [];
  const foldSubs: Array<() => void> = [];

  const getHiddenAreas = () => hiddenAreas;
  const setHiddenAreas = (next: Range[]) => {
    const same =
      next.length === hiddenAreas.length &&
      next.every((r, i) => JSON.stringify(r) === JSON.stringify(hiddenAreas[i]));
    if (same) return;
    hiddenAreas = next;
    foldSubs.forEach((fn) => fn());
  };

  const onDidChangeHiddenAreas = (listener: () => void): t.Monaco.IDisposable => {
    foldSubs.push(listener);
    return {
      dispose() {
        const i = foldSubs.indexOf(listener);
        if (i >= 0) foldSubs.splice(i, 1);
      },
    };
  };

  /**
   * Cursor Position:
   */
  type CursorChangeHandler = (e: t.Monaco.ICursorPositionChangedEvent) => void;
  const onDidChangeCursorPosition = (listener: CursorChangeHandler): t.Monaco.IDisposable => {
    cursorSubs.push(listener);
    return {
      dispose() {
        const i = cursorSubs.indexOf(listener);
        if (i >= 0) cursorSubs.splice(i, 1);
      },
    };
  };
  const setPosition = (pos: t.Offset) => {
    position = pos;
    const evt = {
      position,
      secondaryPositions: null,
      reason: 0, // CursorChangeReason.NotSet
      source: 'keyboard',
    } as unknown as t.Monaco.ICursorPositionChangedEvent;
    cursorSubs.forEach((fn) => fn(evt));
  };

  /**
   * API:
   */
  const api: t.FakeEditor = {
    getPosition: () => position as t.Monaco.Position,
    getModel: () => model as unknown as t.Monaco.TextModel,
    getHiddenAreas,
    setHiddenAreas,
    setPosition,
    trigger: () => void 0,
    // Handlers:
    onDidChangeHiddenAreas,
    onDidChangeCursorPosition,
  };
  return api as t.FakeEditorFull;
};

/**
 * Helpers:
 */
const wrangle = {
  model(input: t.FakeTextModel | string = ''): t.FakeTextModel {
    return typeof input === 'string' ? fakeModel(input) : input;
  },
} as const;
