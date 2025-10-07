import type { t } from './common.ts';
export type * from './t.hooks.ts';

/**
 * Library: tools for parsing the document-id text inputs.
 */
export type DocumentIdParseLib = {
  /** Parses a string of text into parts. */
  textbox(text?: string): DocumentIdParsed;
};

/** The result from the `Parse.textbox` method. */
export type DocumentIdParsed = {
  /** The raw text input */
  readonly text: string;
  /** Document ID if it exists in the raw text. */
  readonly id: string;
  /** Path if it exists in the raw text. */
  readonly path?: t.ObjectPath;
};
