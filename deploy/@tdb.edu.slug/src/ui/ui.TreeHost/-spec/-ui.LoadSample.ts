import { SAMPLES } from '../../-test.ui.ts';
import { type t, SlugClient } from '../common.ts';
import { TreeHost } from '../mod.ts';
import { LoadSampleButtons as Buttons } from './-ui.LoadSample.Buttons.tsx';

let httpRequestNonce = 0;

/**
 * Library:
 */
export const LoadSample = {
  Buttons,
  baseUrl: 'http://localhost:4040/publish.assets',
  tree: { docId: '21JvXzARPYFXDVMag3x4UhLgHcQi' },

  async load(tree: t.Signal<t.TreeNodeList | undefined>, action?: t.SampleLoadAction) {
    if (!action) return void (tree.value = undefined);
    if (action === 'esm:import') {
      tree.value = TreeHost.Data.fromSlugTree(SAMPLES.SlugTree.gHcQi);
      return;
    }
    if (action === 'http') {
      const thisRequest = ++httpRequestNonce;
      const baseUrl = LoadSample.baseUrl;
      const docId = LoadSample.tree.docId;
      SlugClient.loadTreeFromEndpoint(baseUrl, docId).then((res) => {
        if (thisRequest !== httpRequestNonce) return; // ← ignore stale

        tree.value = res.ok ? TreeHost.Data.fromSlugTree(res.value) : undefined;
        if (!res.ok) console.info('[SlugClient] failed to load slug-tree via HTTP', res.error);
      });
    }
  },
} as const;
