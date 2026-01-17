import { SAMPLES, slug } from '../../-test.ui.ts';
import { SlugSheet } from '../../ui.SlugSheet/mod.ts';
import { TreeHost } from '../../ui.TreeHost/-spec/mod.ts';

import { SlugSheetStack } from '../mod.ts';

/**
 * Create a spec harness fixture: a runnable sheet-stack scenario for DevHarness.
 * Provides a stable sample tree, a root sheet, and helpers to push overlays.
 */
export function createFixture() {
  const treeRoot = TreeHost.Data.fromSlugTree(SAMPLES.SlugTree.gHcQi);
  const rootSheet = SlugSheet.Controller.create({ root: treeRoot });
  const stackController = SlugSheetStack.Controller.create();
  stackController.push({ id: 'root', sheet: rootSheet });

  const push = () => {
    const sheet = SlugSheet.Controller.create({ root: treeRoot });
    stackController.push({ id: `overlay-${slug()}`, sheet });
  };

  return {
    treeRoot,
    rootSheet,
    stackController,
    push,
  } as const;
}
