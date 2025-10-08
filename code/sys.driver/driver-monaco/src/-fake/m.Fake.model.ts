import { type t, Num } from './common.ts';
import { makePosition } from './u.ts';

/**
 * Minimal `ITextModel` mock.
 */
export const fakeModel: t.FakeMonacoLib['model'] = (src, options = {}) => {
  // Normalize newlines once so offset/position math is deterministic.
  let text = src.replace(/\r\n/g, '\n');
  let version = 1;
  let language: t.EditorLanguage = 'UNKNOWN';

  const uri: t.Monaco.Uri =
    typeof options.uri === 'string'
      ? ({ toString: () => options.uri } as t.Monaco.Uri)
      : (options.uri ?? ({ toString: () => 'inmemory://model/test' } as t.Monaco.Uri));

  /**
   * Registered listeners:
   */
  const contentListeners: Array<(e: t.Monaco.I.IModelContentChangedEvent) => void> = [];
  const langListeners: Array<(e: t.Monaco.I.IModelLanguageChangedEvent) => void> = [];

  /**
   * Getters (General):
   */
  const getOffsetAt = (pos: t.Offset) => {
    const lines = text.split('\n');
    const lineCount = lines.length;
    const line = Num.clamp(1, lineCount, pos.lineNumber); // NB: clamp to 1-based line index within [1, lineCount]

    // Sum lengths of preceding lines (+1 per '\n')
    let offset = 0;
    for (let i = 0; i < line - 1; i++) offset += (lines[i] ?? '').length + 1;

    // Clamp column within [1, lineLen + 1] (EOL+1 is valid)
    const lineText = lines[line - 1] ?? '';
    const col = Num.clamp(1, lineText.length + 1, pos.column);

    return offset + (col - 1);
  };

  const getPositionAt = (rawOffset: number): t.Monaco.Position => {
    let offset = rawOffset;
    if (offset < 0) offset = 0;

    const lines = text.split('\n');
    let acc = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineLen = lines[i].length;
      const lineEnd = acc + lineLen; // exclusive of newline

      if (offset < lineEnd) {
        // inside this line
        return makePosition(i + 1, offset - acc + 1);
      }

      if (offset === lineEnd) {
        // exactly at boundary: map to next line start if one exists,
        // otherwise clamp to EOL+1 on the last line
        if (i < lines.length - 1) return makePosition(i + 2, 1);
        return makePosition(lines.length, lineLen + 1);
      }

      // move past this line's '\n'
      acc = lineEnd + 1;
    }

    // beyond EOF → clamp to end of last line + 1
    const last = lines.length - 1;
    return makePosition(lines.length, (lines[last]?.length ?? 0) + 1);
  };

  const getValueLength = () => text.length; // includes newlines

  /**
   * Get/Set Language and Text:
   */
  const setValue = (next: string) => {
    const normalized = next.replace(/\r\n/g, '\n');
    if (normalized === text) return; // no-op
    text = normalized;
    version += 1;
    const evt = {} as t.Monaco.I.IModelContentChangedEvent; // minimal
    contentListeners.forEach((fn) => fn(evt));
  };

  const __setLanguageId = (next: t.EditorLanguage) => {
    if (next === language) return;
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

    // Clamp index so column == maxColumn still points at the last char.
    let idx = column - 1;
    if (idx >= line.length) idx = line.length - 1;
    if (idx < 0) return null;

    const ch = line[idx];
    if (!/\w/.test(ch)) return null;

    // Expand backwards:
    let start = idx;
    while (start > 0 && /\w/.test(line[start - 1])) start--;

    // Expand forwards:
    let end = idx;
    while (end < line.length && /\w/.test(line[end])) end++;

    return { word: line.slice(start, end), startColumn: start + 1, endColumn: end + 1 };
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

    /* Setters (Mutate): */
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
