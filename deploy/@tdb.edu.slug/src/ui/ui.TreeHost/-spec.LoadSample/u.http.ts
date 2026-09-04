import { SlugClient, type t, TreeHost } from './common.ts';

let nonce = 0;

export type LoadHttpOptions = {
  readonly baseUrl: t.StringUrl;
  readonly docid: t.StringId;
} & t.SlugLoadTransport;

export async function loadHttp(
  signal: t.Signal<t.TreeHostProps['tree']>,
  opts: LoadHttpOptions,
) {
  const thisRequest = ++nonce;
  const res = await SlugClient.FromEndpoint.Tree.load(opts.baseUrl, opts.docid, opts);
  if (thisRequest !== nonce) return; // ← ignore stale
  if (res.ok) {
    signal.value = TreeHost.Data.fromSlugTree(res.value);
  } else {
    signal.value = undefined;
    console.info('[SlugClient] failed to load slug-tree via HTTP', res.error);
  }
}
