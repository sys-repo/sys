import { type t } from './common.ts';
import { fakeModel } from './u.model.ts';

/**
 * Minimal `IStandaloneCodeEditor` fake.
 */
export const fakeEditor: t.FakeMonacoLib['editor'] = (input) => {
  const model = wrangle.model(input);
  let position: t.Offset = { lineNumber: 1, column: 1 };
  const cursorSubs: Array<(e: t.Monaco.ICursorPositionChangedEvent) => void> = [];

  /**
   * Event Handlers:
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

  /**
   * Methods:
   */
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
    getModel: () => model as unknown as t.Monaco.TextModel,
    onDidChangeCursorPosition,
    setPosition,
  };
  return api as t.Monaco.Editor;
};

/**
 * Helpers:
 */
const wrangle = {
  model(input: t.FakeTextModel | string = ''): t.FakeTextModel {
    return typeof input === 'string' ? fakeModel(input) : input;
  },
} as const;
