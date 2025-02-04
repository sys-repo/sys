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

  /** Convert the parsed-import object to a fully-qualified ESM module-specifier. */
  toString(module: EsmImport): string;
};

/**
 * A parsed ESM import statement.
 */
export type EsmImport = {
  readonly prefix: 'jsr' | 'npm' | '';
  readonly name: string;
  readonly version: t.StringSemver;
};

export type EsmParsedImport = EsmImport & {
  input: string;
  readonly error?: t.StdError;
};
