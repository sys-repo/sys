import type { t } from './common.ts';

type StringSourceCode = string;

/**
 * Minimal Monaco-editor test fakes.
 */
export type FakeMonacoLib = Readonly<{
  model(src: StringSourceCode, options?: { language?: t.EditorLanguage }): t.FakeTextModelFull;
  editor(model?: t.FakeTextModel | StringSourceCode): t.Monaco.Editor;
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
export type FakeEditor = Pick<
  t.Monaco.Editor,
  'getModel' | 'getPosition' | 'setPosition' | 'onDidChangeCursorPosition'
>;
