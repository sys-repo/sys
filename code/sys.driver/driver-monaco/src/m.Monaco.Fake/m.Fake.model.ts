import { type t } from './common.ts';

/**
 * Minimal `ITextModel` mock.
 */
export const fakeModel: t.FakeMonacoLib['model'] = (src, options = {}) => {
  let text = src;
  let version = 1;
  let language: t.EditorLanguage = 'UNKNOWN';

  /**
   * Registered content-change listeners:
   */
  const contentListeners: Array<(e: t.Monaco.I.IModelContentChangedEvent) => void> = [];
  const langListeners: Array<(e: t.Monaco.I.IModelLanguageChangedEvent) => void> = [];

  /**
   * Getters (General):
   */
  const getOffsetAt = ({ lineNumber, column }: t.Offset) => {
    const lines = text.split('\n');
    let offset = 0;
    for (let i = 0; i < lineNumber - 1; i++) offset += lines[i].length + 1;
    return offset + (column - 1);
  };

  /**
   * Get/Set Language:
   */
  const setValue = (next: string) => {
    if (next === text) return; // no change → no event
    text = next;
    version += 1;
    const evt = {} as t.Monaco.I.IModelContentChangedEvent; // minimal event
    contentListeners.forEach((fn) => fn(evt));
  };

  const __setLanguageId = (next: t.EditorLanguage) => {
    if (next === language) return; // no change → no event
    const evt = {
      oldLanguage: language,
      newLanguage: next,
    } as t.Monaco.I.IModelLanguageChangedEvent;
    language = next as t.EditorLanguage;
    langListeners.forEach((fn) => fn(evt));
  };

  /**
   * Event registrations:
   */
  type OnContentChanged = (e: t.Monaco.I.IModelContentChangedEvent) => void;
  const onDidChangeContent = (listener: OnContentChanged): t.Monaco.I.IDisposable => {
    contentListeners.push(listener);
    return {
      dispose() {
        const i = contentListeners.indexOf(listener);
        if (i >= 0) contentListeners.splice(i, 1);
      },
    };
  };

  type OnLanguageChanged = (e: t.Monaco.I.IModelLanguageChangedEvent) => void;
  const onDidChangeLanguage = (listener: OnLanguageChanged): t.Monaco.I.IDisposable => {
    langListeners.push(listener);
    return {
      dispose() {
        const i = langListeners.indexOf(listener);
        if (i >= 0) langListeners.splice(i, 1);
      },
    };
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
    getLineCount: () => text.split('\n').length,
    getLineContent: (lineNumber: number) => text.split('\n')[lineNumber - 1] ?? '',

    /* Stters (Mutate): */
    setValue,

    /* Events: */
    onDidChangeContent,
    onDidChangeLanguage,

    /** Testing API: */
    __setLanguageId,
  };

  /**
   * Initialize:
   */
  if (options.language) __setLanguageId(options.language);
  return api as t.FakeTextModelFull;
};
