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

  return { languages, editor, Uri };
};

/**
 * URI implementation:
 */
export const Uri = {
  parse(input: string): t.Monaco.Uri {
    const i = input.indexOf(':');
    const scheme = i > 0 ? input.slice(0, i) : '';
    let rest = i > 0 ? input.slice(i + 1) : input;

    let authority = '';
    if (rest.startsWith('//')) {
      const after = rest.slice(2);
      const slash = after.indexOf('/');
      const qmark = after.indexOf('?');
      const end = (() => {
        if (slash === -1 && qmark === -1) return after.length;
        if (slash === -1) return qmark;
        if (qmark === -1) return slash;
        return Math.min(slash, qmark);
      })();
      authority = after.slice(0, end);
      rest = after.slice(end); // Starts with '' or '/' or '?'
      if (!rest.startsWith('/')) rest = '/' + rest; // Normalize
    }

    const qIdx = rest.indexOf('?');
    const pathRaw = qIdx >= 0 ? rest.slice(0, qIdx) : rest;
    const query = qIdx >= 0 ? rest.slice(qIdx + 1) : '';

    // Store path without leading slash for consistency.
    const path = pathRaw.replace(/^\/+/, '');

    const toString = (_?: boolean): string => {
      const p = path ? `/${path}` : '';
      const q = query ? `?${query}` : '';
      return authority ? `${scheme}://${authority}${p}${q}` : `${scheme}:${p}${q}`;
    };

    // Include authority (extra prop is fine for structural typing):
    return { scheme, authority, path, query, toString } as unknown as t.Monaco.Uri;
  },

  from(parts: { scheme: string; authority?: string; path?: string; query?: string }): t.Monaco.Uri {
    const scheme = parts.scheme ?? '';
    const authority = parts.authority ?? '';
    const path = (parts.path ?? '').replace(/^\/+/, '');
    const query = parts.query ?? '';

    const toString = (_?: boolean): string => {
      const p = path ? `/${path}` : '';
      const q = query ? `?${query}` : '';
      return authority ? `${scheme}://${authority}${p}${q}` : `${scheme}:${p}${q}`;
    };

    return { scheme, authority, path, query, toString } as unknown as t.Monaco.Uri;
  },
};
