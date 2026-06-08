/**
 * @module
 * Cell descriptor loading, service composition, and finite task execution.
 *
 * A Cell is the folder bounded by its root and described by its
 * `-config/@sys.cell/cell.yaml` descriptor. The descriptor records
 * boot/composition facts: trusted service references, finite task references,
 * and their owner config paths. Services and
 * tasks are declared as ESM endpoints so composition remains typed, importable,
 * and owner-correct instead of hidden in shell choreography.
 */
import type { t } from './common.ts';
import { Services } from './m.Services.ts';
import { Task } from './m.Task.ts';
import { CellSchema } from './u.schema/mod.ts';
import { createTaskMethod } from './u/task.root.ts';

export const Cell: t.Cell.Lib = {
  Schema: CellSchema,
  Services,
  Task,
  async load(root, options) {
    /**
     * Load-only import.
     *
     * Keep this specifier constructed and marked `@vite-ignore` so Vite/Rollup
     * does not scan the FS-aware loader into browser bundles that only import
     * `@sys/cell` for descriptor/schema work. Do NOT simplify this string.
     */
    const LOAD_SPEC = './u/load.ts';
    const { loadCell } = await import(/* @vite-ignore */ LOAD_SPEC);
    return loadCell(root, options);
  },
  start(cell, options) {
    return Services.start(cell, options);
  },
  task: createTaskMethod({
    load: (root, options) => Cell.load(root, options),
    run: (cell, name, options) => Task.run(cell, name, options),
  }),
};
