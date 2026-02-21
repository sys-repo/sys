import type { Storage } from './-SPEC.Debug.tsx';

import { Foo, SAMPLES } from '../../-test.ui.ts';
import { TreeHost } from '../../ui.TreeHost/mod.ts';
import { type t } from '../common.ts';

/**
 * Create slot content for SlugSheet samples.
 */
export function createSlots(
  type: Storage['slots'],
  theme?: t.CommonTheme,
): t.SlugSheetSlots | undefined {
  if (type === 'Foo') {
    return { main: <Foo theme={theme} label={'slot:main'} style={{ padding: 15 }} /> };
  }

  if (type === 'TreeHost') {
    const treeSlots = {
      main: { body: <Foo theme={theme} label={'TreeHost:main.body'} /> },
      nav: { footer: <Foo theme={theme} label={'TreeHost:nav.footer'} style={{ minHeight: 150 }} /> },
    };
    const root = TreeHost.Data.fromSlugTree(SAMPLES.SlugTree['slug-tree.gHcQi:'].embedded);
    return { main: <TreeHost.UI tree={root} slots={treeSlots} /> };
  }

  return undefined;
}
