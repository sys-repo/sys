import { type t, SlugClient } from '../common.ts';
import { TreeHost } from '../mod.ts';

let httpRequestNonce = 0;

export const baseUrl = 'http://localhost:4040/publish.assets';
export const SlugTree = { docId: '21JvXzARPYFXDVMag3x4UhLgHcQi' };

export async function loadHttp(signal: t.Signal<t.TreeNodeList | undefined>) {
  const thisRequest = ++httpRequestNonce;
  const docId = SlugTree.docId;
  SlugClient.Tree.load(baseUrl, docId).then((res) => {
    if (thisRequest !== httpRequestNonce) return; // ← ignore stale
    if (res.ok) {
      signal.value = TreeHost.Data.fromSlugTree(res.value);
    } else {
      signal.value = undefined;
      console.info('[SlugClient] failed to load slug-tree via HTTP', res.error);
    }
  });
}
