import type { t } from './common.ts';

type StringSourceCode = string;

/**
 * Minimal Monaco-editor test fakes.
 */
export type FakeMonacoLib = Readonly<{
  model(src: StringSourceCode, options?: { language?: t.EditorLanguage }): t.FakeTextModelFull;
  editor(model?: t.FakeTextModel | StringSourceCode): t.FakeEditorFull;
}>;

/**
 * Minimal `ITextModel` mock.
 */
export type FakeTextModelFull = t.Monaco.TextModel & t.FakeTextModel;
export type FakeTextModel = Pick<
  t.Monaco.TextModel,
  | 'getValue'
  | 'getOffsetAt'
  | 'getVersionId'
  | 'getLanguageId'
  | 'getLineCount'
  | 'getLineContent'
  //
  | 'setValue'
  //
  | 'onDidChangeContent'
  | 'onDidChangeLanguage'
> & {
  __setLanguageId(next: t.EditorLanguage): void;
};

/**
 * Minimal `IStandaloneCodeEditor` fake:
 */
export type FakeEditorFull = t.Monaco.Editor & t.FakeEditor;
export type FakeEditor = Pick<
  t.Monaco.IStandaloneCodeEditor,
  'getModel' | 'getPosition' | 'setPosition' | 'onDidChangeCursorPosition' | 'trigger'
> & /**
 * NB: ↓ folding helpers (not yet in the d.ts shipped before v0.34):
 */ {
  /** Current hidden (folded) ranges - expressed as model ranges. */
  getHiddenAreas(): t.Monaco.IRange[];
  /** Replace the hidden-area list (pass `[]` to reveal everything). */
  setHiddenAreas(ranges: t.Monaco.IRange[]): void;
  /** Fires after any fold/unfold (user action *or* `setHiddenAreas`). */
  onDidChangeHiddenAreas(listener: () => void): t.Monaco.IDisposable;
};
