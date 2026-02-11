/**
 * @module
 * TreeContentDriver
 * Composable TreeHost selection-to-content bridge adapter.
 *
 * Responsibilities:
 * - wires TreeHost input/output to controller intents and projections
 * - composes effect controllers from `m.effects/*`
 * - projects `{ tree, main, aux }` slots from controller state
 *
 * Non-responsibilities:
 * - no domain orchestration logic in the driver
 * - no direct async loading logic (owned by attached effects)
 * - no mixed state ownership (controller-owned fields are read-only here)
 */
import type { t } from './common.ts';
import { createOrchestrator } from './u.orchestrator.ts';

export const TreeContentDriver: t.TreeContentDriver.Lib = {
  createOrchestrator,
};
