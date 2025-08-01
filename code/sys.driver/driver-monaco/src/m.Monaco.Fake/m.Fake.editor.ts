import { type t, RangeUtil } from './common.ts';
import { fakeModel } from './m.Fake.model.ts';

type IRange = t.Monaco.I.IRange;

/**
 * Minimal `IStandaloneCodeEditor` fake.
 */
export const fakeEditor: t.FakeMonacoLib['editor'] = (input) => {
  const model = wrangle.model(input);
  let position: t.Offset = { lineNumber: 1, column: 1 };
  const cursorSubs: Array<(e: t.Monaco.I.ICursorPositionChangedEvent) => void> = [];

  /**
   * Code Folding:
   */
  let hiddenAreas: IRange[] = [];
  const foldSubs: Array<(areas: IRange[]) => void> = [];

  const getHiddenAreas = () => hiddenAreas;
  const setHiddenAreas = (next: IRange[]) => {
    const same =
      next.length === hiddenAreas.length &&
      next.every((range, i) => RangeUtil.eql(range, hiddenAreas[i]));
    if (same) return;
    hiddenAreas = next;
    foldSubs.forEach((fn) => fn(hiddenAreas));
  };

  const getVisibleRanges = () => {
    return RangeUtil.complement(model.getLineCount(), hiddenAreas) as t.Monaco.Range[];
  };

  const onDidChangeHiddenAreas = (listener: (areas: IRange[]) => void): t.Monaco.I.IDisposable => {
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
  type CursorChangeHandler = (e: t.Monaco.I.ICursorPositionChangedEvent) => void;
  const onDidChangeCursorPosition = (listener: CursorChangeHandler): t.Monaco.I.IDisposable => {
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
      reason: 0, // ← CursorChangeReason.NotSet
      source: 'keyboard',
    } as unknown as t.Monaco.I.ICursorPositionChangedEvent;
    cursorSubs.forEach((fn) => fn(evt));
  };

  /**
   * Trigger:
   */
  const trigger = (_src: string, command: string, payload?: any) => {
    switch (command) {
      /**
       * Commands that DON’T require `selectionLines`
       */
      case 'editor.unfoldAll':
        setHiddenAreas([]); // Reveal everything.
        return;

      /**
       * Commands that DO require `selectionLines`
       */
      case 'editor.fold':
      case 'editor.unfold': {
        const lines: number[] | undefined = payload?.selectionLines;
        if (!lines?.length) return; // invalid payload → no-op

        const to1 = (n: number) => n + 1;
        const sortAsc = (a: number, b: number) => a - b;
        const sorted = [...lines].sort(sortAsc);

        if (command === 'editor.fold') {
          // Build contiguous ranges ↓
          const ranges: IRange[] = [];
          let run: number[] = [];

          const flush = () => {
            if (!run.length) return;
            ranges.push({
              startLineNumber: to1(run[0]),
              startColumn: 1,
              endLineNumber: to1(run[run.length - 1]),
              endColumn: 1,
            });
            run = [];
          };

          sorted.forEach((ln, i) => {
            if (i === 0 || ln === sorted[i - 1] + 1) run.push(ln);
            else {
              flush();
              run.push(ln);
            }
          });
          flush();

          setHiddenAreas([...getHiddenAreas(), ...ranges]);
          return;
        }

        /**
         * editor.unfold
         */
        const reveal = new Set(sorted.map(to1));
        setHiddenAreas(
          getHiddenAreas().filter((r) =>
            [...reveal].every((ln) => ln < r.startLineNumber || ln > r.endLineNumber),
          ),
        );
        return;
      }

      default: /* ignore unknown commands */
    }
  };

  /**
   * API:
   */
  const api: t.FakeEditor = {
    // Getters:
    getPosition: () => position as t.Monaco.Position,
    getModel: () => model as unknown as t.Monaco.TextModel,
    getVisibleRanges,
    getHiddenAreas,

    // Setters (Mutate):
    setHiddenAreas,
    setPosition,
    trigger,

    // Handlers:
    onDidChangeHiddenAreas,
    onDidChangeCursorPosition,
  };

  // NB: shim:
  (api as any)._getViewModel = () => ({ getHiddenAreas });

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
