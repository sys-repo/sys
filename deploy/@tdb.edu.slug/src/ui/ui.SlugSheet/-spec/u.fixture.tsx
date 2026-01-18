import type { Storage } from './-SPEC.Debug.tsx';

import { Foo, SAMPLES } from '../../-test.ui.ts';
import { type t } from '../common.ts';
import { TreeHost } from '../../ui.TreeHost/mod.ts';

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
      main: <Foo theme={theme} label={'TreeHost:main'} />,
      aux: <Foo theme={theme} label={'TreeHost:aux'} style={{ minHeight: 150 }} />,
    };
    const root = TreeHost.Data.fromSlugTree(SAMPLES.SlugTree.gHcQi);
    return { main: <TreeHost.UI root={root} slots={treeSlots} /> };
  }

  return undefined;
}
