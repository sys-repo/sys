import { type t } from './common.ts';

/**
 * Minimal `Monaco` global mock.
 */
export const fakeMonaco = (): t.FakeMonacoGlobal => {
  type P = { provideLinks: (m: t.Monaco.TextModel) => t.Monaco.I.ILinksList };
  const providers = new Map<string, P>();
  let opener: { open(uri: t.Monaco.Uri): boolean | Promise<boolean> } | undefined;

  const disposable = (onDispose: () => void): t.Monaco.I.IDisposable => ({
    dispose: onDispose,
  });

  const UriImpl = {
    parse(input: string): t.Monaco.Uri {
      // Naive split: scheme:rest
      const schemeSplit = input.indexOf(':');
      const scheme = schemeSplit > 0 ? input.slice(0, schemeSplit) : '';
      const rest = schemeSplit > 0 ? input.slice(schemeSplit + 1) : input;

      // Rest may be like "//authority/path?query" or "/path?query" or "path?query"
      // We only need path + query for tests.
      const qIdx = rest.indexOf('?');
      const pathRaw = qIdx >= 0 ? rest.slice(0, qIdx) : rest;
      const query = qIdx >= 0 ? rest.slice(qIdx + 1) : '';

      // Normalize path: remove leading slashes for our crdt tests.
      const path = pathRaw.replace(/^\/+/, '');

      const toString = (skipEncoding?: boolean): string => {
        const q = query ? `?${query}` : '';
        const p = path ? `/${path}` : '';
        return `${scheme}:${p}${q}`;
      };

      return { scheme, path, query, toString } as unknown as t.Monaco.Uri;
    },

    from(parts: { scheme: string; path?: string; query?: string }): t.Monaco.Uri {
      const scheme = parts.scheme ?? '';
      const path = (parts.path ?? '').replace(/^\/+/, '');
      const query = parts.query ?? '';
      const toString = (skipEncoding?: boolean): string => {
        const q = query ? `?${query}` : '';
        const p = path ? `/${path}` : '';
        return `${scheme}:${p}${q}`;
      };
      return { scheme, path, query, toString } as unknown as t.Monaco.Uri;
    },
  };

  const languages = {
    registerLinkProvider(
      languageId: string,
      provider: { provideLinks: (m: t.Monaco.TextModel) => t.Monaco.I.ILinksList },
    ) {
      providers.set(languageId, provider);
      return disposable(() => {
        if (providers.get(languageId) === provider) providers.delete(languageId);
      });
    },

    _provideLinks(languageId: string, model: t.Monaco.TextModel) {
      const p = providers.get(languageId);
      return p?.provideLinks(model);
    },
  };

  const editor = {
    registerLinkOpener(o: { open(uri: t.Monaco.Uri): boolean | Promise<boolean> }) {
      opener = o;
      return disposable(() => {
        if (opener === o) opener = undefined;
      });
    },

    _open(uri: t.Monaco.Uri) {
      if (!opener) throw new Error('No link opener registered');
      return opener.open(uri);
    },
  };

  return { languages, editor, Uri: UriImpl };
};
