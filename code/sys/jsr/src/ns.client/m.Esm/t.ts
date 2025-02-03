import type { t } from './common.ts';

/**
 * Tools for working with ESM imports.
 */
export type EsmLib = {
  /**
   * Determines if the given ESM "import" string represents a
   * "<prefix>:<name>[@<version>]" module name.
   *
   * @param input - The import string to parse.
   * @returns A JsrImport object if the input is valid, or undefined if not.
   */
  parse(input: string): EsmParsedImport;
};

/**
 * Represents a parsed import statement.
 */
export type EsmImport = {
  readonly prefix: 'jsr' | 'npm' | '';
  readonly name: string;
  readonly version: t.StringSemver;
  readonly error?: t.StdError;
};

export type EsmParsedImport = EsmImport & { input: string };
