import type { t } from './common.ts';

type StringSourceCode = string;

/**
 * Minimal Monaco-editor test fakes.
 */
export type FakeMonacoLib = Readonly<{
  model(src: StringSourceCode, options?: t.FakeTextModelOptions): t.FakeTextModelFull;
  editor(model?: t.FakeTextModel | StringSourceCode): t.FakeEditorFull;
}>;

export type FakeTextModelOptions = {
  language?: t.EditorLanguage;
  uri?: t.Monaco.Uri | string;
};

/**
 * Minimal `ITextModel` mock.
 */
export type FakeTextModelFull = t.Monaco.TextModel & t.FakeTextModel;
export type FakeTextModel = Pick<
  t.Monaco.TextModel,
  | 'uri'
  | 'getValue'
  | 'getOffsetAt'
  | 'getVersionId'
  | 'getLanguageId'
  | 'getLineCount'
  | 'getLineContent'
  | 'getValueLength'
  | 'getLineMaxColumn'
  | 'getWordAtPosition'
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
export type FakeEditor = t.EditorHiddenMembers &
  Pick<
    t.Monaco.I.IStandaloneCodeEditor,
    | 'getModel'
    | 'getPosition'
    | 'setPosition'
    | 'getVisibleRanges'
    | 'onDidChangeCursorPosition'
    | 'trigger'
  >;
