import type { t } from './common.ts';

/**
 * Monaco global fake.
 * Includes tiny test hooks for exercising providers/openers.
 */
export type FakeMonacoGlobal = Readonly<{
  languages: {
    registerLinkProvider(
      languageId: string,
      provider: {
        provideLinks(
          model: t.Monaco.TextModel,
          token?: t.Monaco.CancellationToken,
        ): t.Monaco.I.ILinksList;
      },
    ): t.Monaco.I.IDisposable;

    /** Test hook: invoke the provider for a language. */
    _provideLinks(languageId: string, model: t.Monaco.TextModel): t.Monaco.I.ILinksList | undefined;
  };

  editor: {
    registerLinkOpener(opener: {
      open(uri: t.Monaco.Uri): boolean | Promise<boolean>;
    }): t.Monaco.I.IDisposable;

    /** Test hook: call the first registered opener. */
    _open(uri: t.Monaco.Uri): boolean | Promise<boolean>;
  };

  Uri: {
    /** Parse a string `scheme:path?query` (very small subset). */
    parse(input: string): t.Monaco.Uri;
    /** Create from parts (scheme/path/query). */
    from(parts: { scheme: string; path?: string; query?: string }): t.Monaco.Uri;
  };
}>;
