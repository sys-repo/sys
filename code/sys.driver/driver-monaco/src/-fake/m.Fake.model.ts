import { type t } from './common.ts';
import { makePosition } from './u.ts';

/**
 * Minimal `ITextModel` mock.
 */
export const fakeModel: t.FakeMonacoLib['model'] = (src, options = {}) => {
  let text = src;
  let version = 1;
  let language: t.EditorLanguage = 'UNKNOWN';

  const uri: t.Monaco.Uri =
    typeof options.uri === 'string'
      ? ({ toString: () => options.uri } as unknown as t.Monaco.Uri)
      : options.uri ?? ({ toString: () => 'inmemory://model/test' } as unknown as t.Monaco.Uri);

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

  const getPositionAt = (offset: number): t.Monaco.Position => {
    if (offset < 0) offset = 0;

    const lines = text.split('\n');
    let acc = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineLen = lines[i].length;
      const lineEnd = acc + lineLen; // end of content (exclusive of newline)

      if (offset < lineEnd) {
        // inside this line's content
        return makePosition(i + 1, offset - acc + 1);
      }

      if (offset === lineEnd) {
        // exactly at the boundary: either newline or end-of-last-line
        if (i < lines.length - 1) {
          // map to start of next line
          return makePosition(i + 2, 1);
        } else {
          // end of last line -> EOL+1
          return makePosition(lines.length, lineLen + 1);
        }
      }

      // skip newline and advance accumulator to next line start
      acc = lineEnd + 1;
    }

    // past end -> clamp to end-of-last-line + 1
    const last = lines.length - 1;
    return makePosition(lines.length, (lines[last]?.length ?? 0) + 1);
  };

  const getValueLength = () => text.length; // Mirror of Monaco-API `getValueLength()` (total chars incl. newlines).

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

  const getWordAtPosition: t.FakeTextModel['getWordAtPosition'] = ({ lineNumber, column }) => {
    const lines = text.split('\n');
    const line = lines[lineNumber - 1] ?? '';
    // Clamp idx so column == maxColumn still hits the last character.
    let idx = column - 1;
    if (idx >= line.length) idx = line.length - 1;
    if (idx < 0) return null;

    const ch = line[idx];
    if (!/\w/.test(ch)) return null;

    // Expand backwards:
    let start = idx;
    while (start > 0 && /\w/.test(line[start - 1])) {
      start--;
    }

    // Expand forwards:
    let end = idx;
    while (end < line.length && /\w/.test(line[end])) {
      end++;
    }

    return {
      word: line.slice(start, end),
      startColumn: start + 1,
      endColumn: end + 1,
    };
  };

  /**
   * API surface exposed to tests:
   */
  const api: t.FakeTextModel = {
    uri,
    /** Getters */
    getValue: () => text,
    getOffsetAt,
    getPositionAt,
    getVersionId: () => version,
    getLanguageId: () => language,
    getLineCount: () => text.split('\n').length,
    getLineContent: (lineNumber: number) => text.split('\n')[lineNumber - 1] ?? '',
    getLineMaxColumn: (lineNumber: number) => api.getLineContent(lineNumber).length + 1,
    getValueLength,
    getWordAtPosition,

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
