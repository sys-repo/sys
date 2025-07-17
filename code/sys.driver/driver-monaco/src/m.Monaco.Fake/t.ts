import type { t } from './common.ts';

type StringSourceCode = string;

/**
 * Minimal Monaco-editor test fakes.
 */
export type FakeMonacoLib = Readonly<{
  model(src: StringSourceCode): t.FakeTextModelExtended;
  editor(model?: t.FakeTextModel | StringSourceCode): t.Monaco.Editor;
}>;

/**
 * Minimal `ITextModel` mock.
 */
export type FakeTextModel = Pick<
  t.Monaco.TextModel,
  | 'getValue'
  | 'getOffsetAt'
  | 'getVersionId'
  | 'getLanguageId'
  //
  | 'setValue'
  //
  | 'onDidChangeContent'
  | 'onDidChangeLanguage'
> & {
  __setLanguageId(next: t.EditorLanguage): void;
};

export type FakeTextModelExtended = t.Monaco.TextModel & t.FakeTextModel;

/**
 * Minimal `IStandaloneCodeEditor` fake:
 */
export type FakeEditor = Pick<
  t.Monaco.Editor,
  'getModel' | 'setPosition' | 'onDidChangeCursorPosition'
>;
