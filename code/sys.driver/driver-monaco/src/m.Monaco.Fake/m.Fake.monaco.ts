import { type t } from './common.ts';

/**
 * Minimal `Monaco` global mock.
 */
export const fakeMonaco = ((options?: { cast?: boolean }) => {
  type P = { provideLinks: (m: t.Monaco.TextModel) => t.Monaco.I.ILinksList };
  const providers = new Map<string, P>();
  let opener: { open(uri: t.Monaco.Uri): boolean | Promise<boolean> } | undefined;
  const disposable = (dispose: () => void): t.Monaco.I.IDisposable => ({ dispose });

  const models = new Map<string, t.Monaco.TextModel>();
  let modelCounter = 0;

  const positionAt = (text: string, offset: number) => {
    const lineNumber = 1;
    const column = offset + 1;
    return { lineNumber, column };
  };

  const createTextModel = (
    value: string,
    languageId?: string,
    uri?: t.Monaco.Uri,
  ): t.Monaco.TextModel => {
    const id = ++modelCounter;
    const theUri = uri ?? Uri.from({ scheme: 'inmemory', path: `model/${id}` });

    let contents = value;

    const model: t.Monaco.TextModel = {
      uri: theUri,
      getValue: () => contents,
      setValue: (next: string) => (contents = next),
      getPositionAt: (offset: number) => positionAt(contents, offset),
    } as unknown as t.Monaco.TextModel;

    models.set(theUri.toString(true), model);
    return model;
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

    createModel(value: string, languageId?: string, uri?: t.Monaco.Uri) {
      return createTextModel(value, languageId, uri);
    },

    getModels(): t.Monaco.TextModel[] {
      return [...models.values()];
    },

    getModel(uri: t.Monaco.Uri): t.Monaco.TextModel | null {
      return models.get(uri.toString(true)) ?? null;
    },
  };

  const fake = { languages, editor, Uri } as const;

  return options?.cast ? (fake as unknown as t.Monaco.Monaco) : (fake as t.FakeMonacoGlobal);
}) as t.CreateFakeMonaco;

/**
 * URI implementation.
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
      rest = after.slice(end);
      if (!rest.startsWith('/')) rest = '/' + rest;
    }

    const qIdx = rest.indexOf('?');
    const pathRaw = qIdx >= 0 ? rest.slice(0, qIdx) : rest;
    const query = qIdx >= 0 ? rest.slice(qIdx + 1) : '';

    const path = pathRaw.replace(/^\/+/, '');

    const toString = (_?: boolean): string => {
      const p = path ? `/${path}` : '';
      const q = query ? `?${query}` : '';
      return authority ? `${scheme}://${authority}${p}${q}` : `${scheme}:${p}${q}`;
    };

    return { scheme, authority, path, query, toString } as unknown as t.Monaco.Uri;
  },

  from(parts: { scheme: string; authority?: string; path?: string; query?: string }): t.Monaco.Uri {
    const scheme = parts.scheme ?? '';
    const authority = parts.authority?.replace(/^\/+/, '') ?? '';
    const path = (parts.path ?? '').replace(/^\/+/, '');
    const query = (parts.query ?? '').replace(/^\?+/, '');

    const toString = (_?: boolean): string => {
      const p = path ? `/${path}` : '';
      const q = query ? `?${query}` : '';
      return authority ? `${scheme}://${authority}${p}${q}` : `${scheme}:${p}${q}`;
    };

    return { scheme, authority, path, query, toString } as unknown as t.Monaco.Uri;
  },
};
