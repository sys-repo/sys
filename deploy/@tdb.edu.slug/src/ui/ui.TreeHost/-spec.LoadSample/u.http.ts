import { type t, SlugClient, TreeHost } from './common.ts';

let nonce = 0;

export type LoadHttpOptions = {
  readonly baseUrl: t.StringUrl;
  readonly docid: t.StringId;
};

export async function loadHttp(
  signal: t.Signal<t.TreeHostViewNodeList | undefined>,
  opts: LoadHttpOptions,
) {
  const thisRequest = ++nonce;
  SlugClient.FromEndpoint.Tree.load(opts.baseUrl, opts.docid).then((res) => {
    if (thisRequest !== nonce) return; // ← ignore stale
    if (res.ok) {
      signal.value = TreeHost.Data.fromSlugTree(res.value);
    } else {
      signal.value = undefined;
      console.info('[SlugClient] failed to load slug-tree via HTTP', res.error);
    }
  });
}
