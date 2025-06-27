export const DocUrl = {
  key: 'doc',
  get(href?: string) {
    const url = new URL(href ?? location.href);
    const docId = url.searchParams.get(DocUrl.key) || '';
    const exists = !!docId;
    return { url, docId, exists } as const;
  },
  strip() {
    const { url, exists } = DocUrl.get();
    if (!exists) return;

    url.searchParams.delete(DocUrl.key);
    const relative = url.pathname + url.search + url.hash;
    history.replaceState(null, '', relative);
  },
} as const;
