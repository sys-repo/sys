import { Foo } from '../../-test.ui.ts';

import type { t } from '../../ui.SlugSheet/common.ts';
import { SlugSheet } from '../../ui.SlugSheet/mod.ts';
import { SlugSheetStack } from '../mod.ts';

/**
 * Create a spec harness fixture: a runnable sheet-stack scenario for DevHarness.
 * Provides a stable sample tree, a root sheet, and helpers to push overlays.
 */
export function createFixture(rootLabel = 'root') {
  const push = (label: t.ReactNode = `level-${controller.length}`) => {
    const slots = createSlots(label);
    const sheet = SlugSheet.Controller.create({ props: () => ({ slots }) });

    controller.push({ sheet });

    return sheet;
  };

  const controller = SlugSheetStack.Controller.create();
  const rootSheet = push(rootLabel);

  return {
    rootSheet,
    controller,
    push,
    pop: controller.pop,
  } as const;
}

function createSlots(label: t.ReactNode): t.SlugSheetSlots {
  return {
    main: <Foo label={label} style={{ fontSize: 38 }} padding={30} />,
  };
}
