import type { t } from './common.ts';

/**
 * Factory: create a new global `monaco` mock.
 *
 * - No arg → returns the raw `FakeMonacoGlobal`
 * - Pass `{ cast: true }` → returns `t.Monaco.Monaco` (casted variant)
 */
export type CreateFakeMonaco = {
  (): t.FakeMonacoGlobal;
  (options: { cast?: false }): t.FakeMonacoGlobal;
  (options: { cast: true }): t.Monaco.Monaco;
};

/**
 * Minimal `Monaco` global mock.
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

    /**
     * Create a new text model.
     * Real Monaco: monaco.editor.createModel(value, languageId?, uri?)
     */
    createModel(value: string, languageId?: string, uri?: t.Monaco.Uri): t.Monaco.TextModel;

    /**
     * Get a model by its URI.
     * Real Monaco: monaco.editor.getModel(uri)
     */
    getModel(uri: t.Monaco.Uri): t.Monaco.TextModel | null;

    /**
     * Get all models.
     * Real Monaco: monaco.editor.getModels()
     */
    getModels(): t.Monaco.TextModel[];
  };

  Uri: {
    /** Parse a string `scheme:path?query` (very small subset). */
    parse(input: string): t.Monaco.Uri;
    /** Create from parts (scheme/path/query). */
    from(parts: {
      scheme: string;
      path?: string;
      query?: string;
      authority?: string;
    }): t.Monaco.Uri;
  };
}>;
