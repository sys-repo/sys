import { type t, D, Is } from './common.ts';

export const DocUrl = {
  key: D.urlKey,

  read(href: string, key: string = D.urlKey) {
    const url = new URL(href);
    const docId = url.searchParams.get(key) || '';
    const exists = !!docId;
    return { url, docId, exists } as const;
  },

  createFrom(href: string, docId: t.StringId, key: string = D.urlKey) {
    const url = new URL(href);
    url.searchParams.set(key, docId);
    return url;
  },

  resolve(urlProp: t.UseDocumentIdHookArgs['url'], docId: t.StringId, urlKey?: string) {
    if (urlProp == null) return undefined;
    if (urlProp === true) return DocUrl.createFrom(location.href, docId, urlKey).href;
    if (Is.func(urlProp)) return urlProp({ docId, urlKey: urlKey ?? D.urlKey });
    return undefined;
  },

  /**
   * Mutates the browser's URL:
   */
  Mutate: {
    strip(href: string, key: string = D.urlKey) {
      const { url, exists } = DocUrl.read(href, key);
      if (exists) {
        url.searchParams.delete(key);
        DocUrl.Mutate.replace(url.href);
      }
    },

    replace(href: string) {
      const url = new URL(href);
      const relative = url.pathname + url.search + url.hash;
      history.replaceState(null, '', relative);
    },
  },
} as const;
