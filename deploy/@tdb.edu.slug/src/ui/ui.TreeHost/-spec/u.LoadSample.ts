import { SAMPLES } from '../../-test.ui.ts';
import { type t } from '../common.ts';
import { TreeHost } from '../mod.ts';
import { LoadSampleButtons as Buttons } from './u.LoadSample.UI.tsx';
import { baseUrl, loadHttp, SlugTree } from './u.LoadSample.http.ts';

/**
 * Library:
 */
export const LoadSample = {
  Buttons,
  SlugTree,
  baseUrl,

  async load(tree: t.Signal<t.TreeNodeList | undefined>, action?: t.SampleLoadAction) {
    if (!action) return void (tree.value = undefined);
    if (action === 'esm:import') {
      tree.value = TreeHost.Data.fromSlugTree(SAMPLES.SlugTree['slug-tree.gHcQi:']);
      return;
    }
    if (action === 'http') {
      await loadHttp(tree);
      return;
    }
  },
} as const;
