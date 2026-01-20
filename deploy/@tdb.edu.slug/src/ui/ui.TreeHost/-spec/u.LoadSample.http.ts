import { type t, SlugClient } from '../common.ts';
import { TreeHost } from '../mod.ts';

let httpRequestNonce = 0;

export const baseUrl = 'http://localhost:4040/publish.assets';
export const SlugTree = { docId: '21JvXzARPYFXDVMag3x4UhLgHcQi' };

export async function loadHttp(tree: t.Signal<t.TreeNodeList | undefined>) {
  const thisRequest = ++httpRequestNonce;
  const docId = SlugTree.docId;
  SlugClient.loadTreeFromEndpoint(baseUrl, docId).then((res) => {
    if (thisRequest !== httpRequestNonce) return; // ← ignore stale
    tree.value = res.ok ? TreeHost.Data.fromSlugTree(res.value) : undefined;
    if (!res.ok) console.info('[SlugClient] failed to load slug-tree via HTTP', res.error);
  });
}
