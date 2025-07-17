import { type t } from './common.ts';

/**
 * Minimal `ITextModel` mock.
 */
export const fakeModel: t.FakeMonacoLib['model'] = (src) => {
  let text = src;
  let version = 1;
  let language: t.EditorLanguage = 'UNKNOWN';

  /**
   * Registered content-change listeners:
   */
  const contentListeners: Array<(e: t.Monaco.IModelContentChangedEvent) => void> = [];
  const langListeners: Array<(e: t.Monaco.IModelLanguageChangedEvent) => void> = [];

  /**
   * Helpers:
   */
  const getOffsetAt = ({ lineNumber, column }: t.Offset) => {
    const lines = text.split('\n');
    let offset = 0;
    for (let i = 0; i < lineNumber - 1; i++) offset += lines[i].length + 1;
    return offset + (column - 1);
  };

  /**
   * Event registrations:
   */
  type OnContentChanged = (e: t.Monaco.IModelContentChangedEvent) => void;
  const onDidChangeContent = (listener: OnContentChanged): t.Monaco.IDisposable => {
    contentListeners.push(listener);
    return {
      dispose() {
        const i = contentListeners.indexOf(listener);
        if (i >= 0) contentListeners.splice(i, 1);
      },
    };
  };

  type OnLanguageChanged = (e: t.Monaco.IModelLanguageChangedEvent) => void;
  const onDidChangeLanguage = (listener: OnLanguageChanged): t.Monaco.IDisposable => {
    langListeners.push(listener);
    return {
      dispose() {
        const i = langListeners.indexOf(listener);
        if (i >= 0) langListeners.splice(i, 1);
      },
    };
  };

  /**
   * Mutators:
   */
  const setValue = (next: string) => {
    if (next === text) return; // no change → no event
    text = next;
    version += 1;
    const evt = {} as t.Monaco.IModelContentChangedEvent; // minimal event
    contentListeners.forEach((fn) => fn(evt));
  };

  const __setLanguageId = (next: t.EditorLanguage) => {
    if (next === language) return; // no change → no event
    const evt = {
      oldLanguage: language,
      newLanguage: next,
    } as t.Monaco.IModelLanguageChangedEvent;
    language = next as t.EditorLanguage;
    langListeners.forEach((fn) => fn(evt));
  };

  /**
   * API surface exposed to tests.
   */
  const api: t.FakeTextModel = {
    /** Getters */
    getValue: () => text,
    getOffsetAt,
    getVersionId: () => version,
    getLanguageId: () => language,

    /* Mutators */
    setValue,
    // setLanguageId,

    /* Events */
    onDidChangeContent,
    onDidChangeLanguage,

    /** Mock API: */
    __setLanguageId,
  };

  return api as t.FakeTextModelExtended;
};
