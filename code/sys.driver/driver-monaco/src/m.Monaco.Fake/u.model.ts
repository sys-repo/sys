import { type t } from './common.ts';

/**
 * Minimal `ITextModel` mock.
 */
export const fakeModel: t.FakeMonacoLib['model'] = (src) => {
  let text = src;
  const listeners: Array<(e: t.Monaco.IModelContentChangedEvent) => void> = [];

  /**
   * Methods (subset used by tests):
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

  const setValue = (next: string) => {
    text = next;
    // NB: minimal event object – enough to satisfy the type system
    const evt = {} as t.Monaco.IModelContentChangedEvent;
    listeners.forEach((fn) => fn(evt));
  };

  /**
   * API:
   */
  const api: t.FakeModel = {
    getValue: () => text,
    setValue,
    getOffsetAt,
    onDidChangeContent,
  };
  return api as t.Monaco.TextModel;
};
