import { TreeHost } from '../mod.ts';
import { type t, SAMPLES } from './common.ts';
import { baseUrl, loadHttp, SlugTree } from './u.http.ts';
import { LoadSampleButtons as UI } from './ui.tsx';

/**
 * Library:
 */
export const LoadSample = {
  UI,
  SlugTree,
  baseUrl,

  async load(
    tree: t.Signal<t.TreeHostViewNodeList | undefined>,
    action: t.SampleLoadAction | undefined,
    opts: { baseUrl?: t.StringUrl } = {},
  ) {
    if (!action) return void (tree.value = undefined);
    if (action === 'esm:import') {
      tree.value = TreeHost.Data.fromSlugTree(SAMPLES.SlugTree['slug-tree.gHcQi:']);
      return;
    }
    if (action === 'http') {
      await loadHttp(tree, { baseUrl: opts.baseUrl ?? baseUrl });
      return;
    }
  },
} as const;
