/**
 * @module
 * FileContentDriver
 * Thin driver head that reuses `TreeContentDriver` core orchestration.
 */
import { type t, TreeContentDriver } from './common.ts';

export const FileContentDriver: t.FileContentDriver.Lib = {
  orchestrator: TreeContentDriver.orchestrator,
};
