import { headless } from '../-test/headless/mod.ts';
import { DevBus as Bus } from '../u/m.Bus/mod.ts';
import { Context } from '../u/m.Ctx/mod.ts';
import { Spec } from '../u/m.Spec/mod.ts';
import { Theme } from '../u/m.Theme/mod.ts';
import { ValueHandler } from '../u/m.Tools/mod.ts';
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
  Theme,
  ValueHandler,
  headless,
} as const;
