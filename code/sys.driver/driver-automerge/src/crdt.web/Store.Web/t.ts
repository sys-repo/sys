import type { t } from './common.ts';

/**
 * Store (a repository of documents) that runs on the browser.
 */
export type WebStore = t.Store & {
  readonly info: WebStoreInfo;
};

export type WebStoreInfo = {
  readonly storage?: { readonly kind: 'IndexedDb'; readonly name: string };
  readonly network?: { readonly kinds: t.StoreNetworkKind[] };
};
