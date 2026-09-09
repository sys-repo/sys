import { headless } from '../-test/headless/mod.ts';
import { DevBus as Bus } from '../u/m.Bus/mod.ts';
import { Context } from '../u/m.Ctx/mod.ts';
import { Spec } from '../u/m.Spec/mod.ts';
import { Theme } from '../u/m.Theme/mod.ts';
import { ValueHandler } from '../u/m.Tools/mod.ts';
import { Harness as UI } from '../ui/Harness/mod.ts';
import { ModuleList } from '../ui/ModuleList/mod.ts';

/** Aggregate runtime surface for DevHarness specs, rendering, context, and headless tools. */
export const Harness = {
  Context,
  Bus,
  Spec,
  ModuleList,
  UI,
  Theme,
  ValueHandler,
  headless,
} as const;
