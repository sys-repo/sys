/**
 * @module
 * Cell descriptor loading, service composition, and finite task execution.
 *
 * A Cell is the folder bounded by its root and described by its `cell.yaml`
 * descriptor. The descriptor records boot/composition facts: trusted service
 * references, finite task references, and their owner config paths. Services and
 * tasks are declared as ESM endpoints so composition remains typed, importable,
 * and owner-correct instead of hidden in shell choreography.
 */
import type { t } from './common.ts';
import { CellSchema } from './u.schema/mod.ts';
import { createTaskMethod } from './u.task.root.ts';

export const Cell: t.Cell.Lib = {
  Schema: CellSchema,
  Services: {
    async plan(cell, options) {
      /**
       * Services-only planner import.
       *
       * Keep this specifier constructed and marked `@vite-ignore` so Vite/Rollup
       * does not scan FS/import-aware services helpers into browser bundles
       * that only import `@sys/cell` for descriptor/schema work. Do NOT simplify
       * this string.
       */
      const SERVICES_SPEC = './u.' + 'services/mod.ts';
      const { CellServices } = await import(/* @vite-ignore */ SERVICES_SPEC);
      return CellServices.plan(cell, options);
    },
    async verify(cell, options) {
      /**
       * Services-only verifier import.
       *
       * Keep this specifier constructed and marked `@vite-ignore` so Vite/Rollup
       * does not scan the FS/import-aware services verifier into browser bundles
       * that only import `@sys/cell` for descriptor/schema work. Do NOT simplify
       * this string.
       */
      const SERVICES_SPEC = './u.' + 'services/mod.ts';
      const { CellServices } = await import(/* @vite-ignore */ SERVICES_SPEC);
      return CellServices.verify(cell, options);
    },
    async start(cell, options) {
      /**
       * Services-only starter import.
       *
       * Keep this specifier constructed and marked `@vite-ignore` so Vite/Rollup
       * does not scan the FS/import-aware services starter into browser bundles
       * that only import `@sys/cell` for descriptor/schema work. Do NOT simplify
       * this string.
       */
      const SERVICES_SPEC = './u.' + 'services/mod.ts';
      const { CellServices } = await import(/* @vite-ignore */ SERVICES_SPEC);
      return CellServices.start(cell, options);
    },
    async wait(started) {
      /**
       * Services-only waiter import.
       *
       * Keep this specifier constructed and marked `@vite-ignore` so Vite/Rollup
       * does not scan service lifecycle helpers into browser bundles that only
       * import `@sys/cell` for descriptor/schema work. Do NOT simplify this
       * string.
       */
      const SERVICES_SPEC = './u.' + 'services/mod.ts';
      const { CellServices } = await import(/* @vite-ignore */ SERVICES_SPEC);
      return CellServices.wait(started);
    },
  },
  Task: {
    async plan(cell, name, options) {
      /**
       * Task-only planner import.
       *
       * Keep this specifier constructed and marked `@vite-ignore` so Vite/Rollup
       * does not scan task runtime helpers into browser bundles that only import
       * `@sys/cell` for descriptor/schema work. Do NOT simplify this string.
       */
      const TASK_SPEC = './u.' + 'task/mod.ts';
      const { CellTask } = await import(/* @vite-ignore */ TASK_SPEC);
      return CellTask.plan(cell, name, options);
    },
    async verify(cell, options) {
      /**
       * Task-only verifier import.
       *
       * Keep this specifier constructed and marked `@vite-ignore` so Vite/Rollup
       * does not scan the FS/import-aware task verifier into browser bundles
       * that only import `@sys/cell` for descriptor/schema work. Do NOT simplify
       * this string.
       */
      const TASK_SPEC = './u.' + 'task/mod.ts';
      const { CellTask } = await import(/* @vite-ignore */ TASK_SPEC);
      return CellTask.verify(cell, options);
    },
    async run(cell, name, options) {
      /**
       * Task-only runner import.
       *
       * Keep this specifier constructed and marked `@vite-ignore` so Vite/Rollup
       * does not scan the FS/import-aware task runner into browser bundles that
       * only import `@sys/cell` for descriptor/schema work. Do NOT simplify this
       * string.
       */
      const TASK_SPEC = './u.' + 'task/mod.ts';
      const { CellTask } = await import(/* @vite-ignore */ TASK_SPEC);
      return CellTask.run(cell, name, options);
    },
  },
  async load(root, options) {
    /**
     * Load-only import.
     *
     * Keep this specifier constructed and marked `@vite-ignore` so Vite/Rollup
     * does not scan the FS-aware loader into browser bundles that only import
     * `@sys/cell` for descriptor/schema work. Do NOT simplify this string.
     */
    const LOAD_SPEC = './u.' + 'load.ts';
    const { loadCell } = await import(/* @vite-ignore */ LOAD_SPEC);
    return loadCell(root, options);
  },
  start(cell, options) {
    return Cell.Services.start(cell, options);
  },
  task: createTaskMethod({
    load: (root, options) => Cell.load(root, options),
    run: (cell, name, options) => Cell.Task.run(cell, name, options),
  }),
};
