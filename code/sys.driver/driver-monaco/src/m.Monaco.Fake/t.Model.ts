import type { t } from './common.ts';

type StringSrcCode = string;

/**
 * Factory: Create a new text model fake.
 */
export type CreateFakeTextModel = (
  src: StringSrcCode,
  options?: t.FakeTextModelOptions,
) => t.FakeTextModelFull;

/** Options passed to the text-model factory. */
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
