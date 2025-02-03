import type { t } from './common.ts';

/**
 * Tools for working with systems and runtimes that support
 * the ESM (EcmaScript Module) standard.
 */
export type EsmLib = {
  /**
   * Parses an "import" module-specifier string.
   *
   * @param moduleSpecifier - The import string to parse.
   * @returns A EsmImport object if the input is valid
   *          See the `error` property for failure state.
   */
  parse(moduleSpecifier: string): EsmParsedImport;
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
