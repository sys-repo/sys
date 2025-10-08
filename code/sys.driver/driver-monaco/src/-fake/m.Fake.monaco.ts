import { type t } from './common.ts';
import { fakeModel } from './m.Fake.model.ts';

type TextModel = t.Monaco.TextModel;

/**
 * Minimal `Monaco` global mock.
 */
export const fakeMonaco = ((options?: { cast?: boolean }) => {
  type P = { provideLinks: (m: TextModel) => t.Monaco.I.ILinksList };
  const providers = new Map<string, P>();
  let opener: { open(uri: t.Monaco.Uri): boolean | Promise<boolean> } | undefined;
  const disposable = (dispose: () => void): t.Monaco.I.IDisposable => ({ dispose });

  const models = new Map<string, TextModel>();
  const markerStore = new Map<string, t.Monaco.I.IMarkerData[]>();
  const markerKey = (m: TextModel, owner: string) => `${m.uri.toString(true)}::${owner}`;

  let _modelCounter = 0;
  const createTextModel = (value: string, languageId?: string, uri?: t.Monaco.Uri): TextModel => {
    uri = uri ?? Uri.from({ scheme: 'inmemory', path: `model/${++_modelCounter}` });
    const language = languageId as unknown as t.EditorLanguage;
    const fm = fakeModel(value, { language, uri });
    models.set(uri.toString(true), fm);
    return fm;
  };

  const languages = {
    registerLinkProvider(
      languageId: string,
      provider: { provideLinks: (m: TextModel) => t.Monaco.I.ILinksList },
    ) {
      providers.set(languageId, provider);
      return disposable(() => {
        if (providers.get(languageId) === provider) providers.delete(languageId);
      });
    },

    _provideLinks(languageId: string, model: TextModel) {
      const p = providers.get(languageId);
      return p?.provideLinks(model);
    },
  };

  const editor = {
    setModelMarkers(model: TextModel, owner: string, markers: t.Monaco.I.IMarkerData[]) {
      markerStore.set(markerKey(model, owner), markers ?? []);
    },

    getModelMarkers(filter: { owner?: string; resource?: t.Monaco.Uri }) {
      const out: t.Monaco.I.IMarkerData[] = [];
      const wantOwner = filter.owner;
      const wantUri = filter.resource?.toString(true);

      if (wantOwner && wantUri) {
        return markerStore.get(`${wantUri}::${wantOwner}`) ?? [];
      }

      for (const [key, markers] of markerStore.entries()) {
        const [uriKey, ownerKey] = key.split('::');
        if (wantOwner && ownerKey !== wantOwner) continue;
        if (wantUri && uriKey !== wantUri) continue;
        out.push(...markers);
      }
      return out;
    },

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

    getModels(): TextModel[] {
      return [...models.values()];
    },

    getModel(uri: t.Monaco.Uri): TextModel | null {
      return models.get(uri.toString(true)) ?? null;
    },
  };

  const MarkerSeverity = { Hint: 1, Info: 2, Warning: 4, Error: 8 } as const;
  const fake = { languages, editor, Uri, MarkerSeverity } as const;

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
