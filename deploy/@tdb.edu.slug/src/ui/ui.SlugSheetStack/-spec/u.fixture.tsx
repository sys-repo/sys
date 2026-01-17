import { Foo, SAMPLES, slug } from '../../-test.ui.ts';
import type { t } from '../../ui.SlugSheet/common.ts';
import { SlugSheet } from '../../ui.SlugSheet/mod.ts';
import { TreeHost } from '../../ui.TreeHost/-spec/mod.ts';

import { SlugSheetStack } from '../mod.ts';

/**
 * Create a spec harness fixture: a runnable sheet-stack scenario for DevHarness.
 * Provides a stable sample tree, a root sheet, and helpers to push overlays.
 */
export function createFixture() {
  const treeRoot = TreeHost.Data.fromSlugTree(SAMPLES.SlugTree.gHcQi);
  const rootSlots = createSlots('root');
  const rootSheet = SlugSheet.Controller.create({ root: treeRoot, treeHostSlots: rootSlots });
  const stackController = SlugSheetStack.Controller.create();
  stackController.push({ id: 'root', sheet: rootSheet });

  const push = () => {
    const slots = createSlots(`overlay-${slug()}`);
    const sheet = SlugSheet.Controller.create({ root: treeRoot, treeHostSlots: slots });
    stackController.push({ id: `overlay-${slug()}`, sheet });
  };

  return {
    treeRoot,
    rootSheet,
    stackController,
    push,
  } as const;
}

function createSlots(label: string): t.TreeHostSlots {
  return {
    main: <Foo label={`tree:${label}:main`} />,
    aux: <Foo label={`tree:${label}:aux`} />,
  };
}
