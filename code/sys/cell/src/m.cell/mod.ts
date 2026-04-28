/**
 * @module
 * Cell descriptor loading and runtime service composition.
 *
 * A Cell is a folder bounded by its root and described by
 * `-config/@sys.cell/cell.yaml`. The descriptor binds DSL, view, and runtime
 * service references using paths relative to the Cell root. Runtime services
 * are declared as ESM lifecycle endpoints so service composition remains typed,
 * importable, and owner-correct instead of hidden in shell task choreography.
 */
import type { t } from './common.ts';

export const Cell: t.Cell.Lib = {};
