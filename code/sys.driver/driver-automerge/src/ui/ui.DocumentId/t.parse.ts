import type { t } from './common.ts';

/** Library of tools for parsing document-id text inputs. */
export type Lib = {
  /** Parse a string of text into parts. */
  textbox(text?: string): Result;
};

/** The result from the `Parse.textbox` method. */
export type Result = {
  /** The raw text input. */
  readonly text: string;
  /** Document ID if it exists in the raw text. */
  readonly id: string;
  /** Path if it exists in the raw text. */
  readonly path?: t.ObjectPath;
};
