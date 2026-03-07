import { TreeHost } from '../mod.ts';
import { type t, SAMPLES } from './common.ts';
import { loadHttp } from './u.http.ts';
import { LoadSampleButtons as UI } from './ui.tsx';

/**
 * Library:
 */
export const LoadSample = {
  UI,
  SAMPLES,

  async load(
    tree: t.Signal<t.TreeHostProps['tree']>,
    action: t.SampleLoadAction | undefined,
    opts: { baseUrl: t.StringUrl; docid: t.StringId },
  ) {
    if (!action) return void (tree.value = undefined);
    if (action === 'esm:import') {
      tree.value = TreeHost.Data.fromSlugTree(SAMPLES.SlugTree['slug-tree.gHcQi:'].embedded);
      return;
    }
    if (action === 'http') {
      await loadHttp(tree, { baseUrl: opts.baseUrl, docid: opts.docid });
      return;
    }
  },
} as const;
