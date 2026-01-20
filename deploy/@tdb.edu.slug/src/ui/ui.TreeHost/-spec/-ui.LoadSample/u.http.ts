import { type t, SlugClient, TreeHost } from './common.ts';

let nonce = 0;

export const baseUrl = 'http://localhost:4040/publish.assets';
export const SlugTree = { docId: '21JvXzARPYFXDVMag3x4UhLgHcQi' };

export async function loadHttp(signal: t.Signal<t.TreeNodeList | undefined>) {
  const thisRequest = ++nonce;
  const docId = SlugTree.docId;
  SlugClient.Tree.load(baseUrl, docId).then((res) => {
    if (thisRequest !== nonce) return; // ← ignore stale
    if (res.ok) {
      signal.value = TreeHost.Data.fromSlugTree(res.value);
    } else {
      signal.value = undefined;
      console.info('[SlugClient] failed to load slug-tree via HTTP', res.error);
    }
  });
}
