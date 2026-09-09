import type { t } from './common.ts';

type StringSrcCode = string;

/** Factory: create a new text model fake. */
export type Create = (src: StringSrcCode, options?: Options) => Full;

/** Options passed to the text-model factory. */
export type Options = {
  language?: t.EditorLanguage;
  uri?: t.Monaco.Uri | string;
};

/** Minimal `ITextModel` mock, cast with Monaco text-model shape. */
export type Full = t.Monaco.TextModel & Shape;

/** Minimal `ITextModel` mock shape. */
export type Shape = Pick<
  t.Monaco.TextModel,
  | 'uri'
  | 'getValue'
  | 'getOffsetAt'
  | 'getPositionAt'
  | 'getVersionId'
  | 'getLanguageId'
  | 'getLineCount'
  | 'getLineContent'
  | 'getValueLength'
  | 'getLineMaxColumn'
  | 'getWordAtPosition'
  | 'setValue'
  | 'onDidChangeContent'
  | 'onDidChangeLanguage'
  | 'isDisposed'
  | 'dispose'
> & {
  __setLanguageId(next: t.EditorLanguage): void;
};
