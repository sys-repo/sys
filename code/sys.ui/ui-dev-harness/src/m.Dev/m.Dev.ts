import { DevBus as Bus } from '../u/m.Bus/mod.ts';
import { Context } from '../u/m.Ctx/mod.ts';
import { Spec } from '../u/Spec/mod.ts';
import { ValueHandler } from '../u/Tools/mod.ts';
import { headless } from '../-test/headless/mod.ts';
import { Harness } from '../ui/Harness/mod.ts';
import { ModuleList } from '../ui/ModuleList/mod.ts';

/**
 * Root entry to the DevHarness.
 */
export const Dev = {
  Context,
  Bus,
  Spec,
  ModuleList,
  Harness,
  ValueHandler,
  headless,
} as const;
