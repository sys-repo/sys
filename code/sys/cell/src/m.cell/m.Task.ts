import type { t } from './common.ts';

export const Task: t.Cell.Task.Lib = Object.freeze({
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
});
