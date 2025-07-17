import { type t } from './common.ts';

/**
 * Minimal `ITextModel` mock.
 */
export const fakeModel: t.FakeMonacoLib['model'] = (src) => {
  let text = src;
  let version = 1;

  /**
   * Registered content-change listeners.
   */
  const listeners: Array<(e: t.Monaco.IModelContentChangedEvent) => void> = [];

  /**
   * Helpers
   */
  const getOffsetAt = ({ lineNumber, column }: t.Offset) => {
    const lines = text.split('\n');
    let offset = 0;
    for (let i = 0; i < lineNumber - 1; i++) offset += lines[i].length + 1;
    return offset + (column - 1);
  };

  type ChangeHandler = (e: t.Monaco.IModelContentChangedEvent) => void;
  const onDidChangeContent = (listener: ChangeHandler): t.Monaco.IDisposable => {
    listeners.push(listener);
    return {
      dispose() {
        const i = listeners.indexOf(listener);
        if (i >= 0) listeners.splice(i, 1);
      },
    };
  };

  /**
   * Mutators
   */
  const setValue = (next: string) => {
    if (next === text) return; // no change → no event
    text = next;
    version += 1;
    const evt = {} as t.Monaco.IModelContentChangedEvent; // minimal event
    listeners.forEach((fn) => fn(evt));
  };

  /**
   * API surface exposed to tests.
   */
  const api: t.FakeModel = {
    getValue: () => text,
    setValue,
    getOffsetAt,
    onDidChangeContent,
    getVersionId: () => version,
  };

  return api as t.Monaco.TextModel;
};
