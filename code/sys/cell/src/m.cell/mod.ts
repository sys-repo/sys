/**
 * @module
 * Cell descriptor loading and runtime service composition.
 *
 * A Cell is a folder bounded by its root and described by
 * `-config/@sys.cell/cell.yaml`. The descriptor records boot/composition facts:
 * trusted runtime service references and their owner config paths. Runtime
 * services are declared as ESM lifecycle endpoints so service composition remains
 * typed, importable, and owner-correct instead of hidden in shell task choreography.
 */
import type { t } from './common.ts';
import { CellSchema } from './u.schema/mod.ts';

export const Cell: t.Cell.Lib = {
  Schema: CellSchema,
  Runtime: {
    async verify(cell, options) {
      /**
       * Runtime-only service verifier import.
       *
       * Keep this specifier constructed and marked `@vite-ignore` so Vite/Rollup
       * does not scan the FS/import-aware runtime verifier into browser bundles
       * that only import `@sys/cell` for descriptor/schema work. Do NOT simplify
       * this string.
       */
      const RUNTIME_SPEC = './u.' + 'runtime/mod.ts';
      const { CellRuntime } = await import(/* @vite-ignore */ RUNTIME_SPEC);
      return CellRuntime.verify(cell, options);
    },
    async start(cell, options) {
      /**
       * Runtime-only service starter import.
       *
       * Keep this specifier constructed and marked `@vite-ignore` so Vite/Rollup
       * does not scan the FS/import-aware runtime starter into browser bundles
       * that only import `@sys/cell` for descriptor/schema work. Do NOT simplify
       * this string.
       */
      const RUNTIME_SPEC = './u.' + 'runtime/mod.ts';
      const { CellRuntime } = await import(/* @vite-ignore */ RUNTIME_SPEC);
      return CellRuntime.start(cell, options);
    },
    async wait(runtime) {
      /**
       * Runtime-only service waiter import.
       *
       * Keep this specifier constructed and marked `@vite-ignore` so Vite/Rollup
       * does not scan runtime lifecycle helpers into browser bundles that only
       * import `@sys/cell` for descriptor/schema work. Do NOT simplify this string.
       */
      const RUNTIME_SPEC = './u.' + 'runtime/mod.ts';
      const { CellRuntime } = await import(/* @vite-ignore */ RUNTIME_SPEC);
      return CellRuntime.wait(runtime);
    },
  },
  Action: {
    async verify(cell, options) {
      /**
       * Action-only verifier import.
       *
       * Keep this specifier constructed and marked `@vite-ignore` so Vite/Rollup
       * does not scan the FS/import-aware action verifier into browser bundles
       * that only import `@sys/cell` for descriptor/schema work. Do NOT simplify
       * this string.
       */
      const ACTION_SPEC = './u.' + 'action/mod.ts';
      const { CellAction } = await import(/* @vite-ignore */ ACTION_SPEC);
      return CellAction.verify(cell, options);
    },
    async run(cell, name, options) {
      /**
       * Action-only runner import.
       *
       * Keep this specifier constructed and marked `@vite-ignore` so Vite/Rollup
       * does not scan the FS/import-aware action runner into browser bundles
       * that only import `@sys/cell` for descriptor/schema work. Do NOT simplify
       * this string.
       */
      const ACTION_SPEC = './u.' + 'action/mod.ts';
      const { CellAction } = await import(/* @vite-ignore */ ACTION_SPEC);
      return CellAction.run(cell, name, options);
    },
  },
  async load(root, options) {
    /**
     * Runtime-only loader import.
     *
     * Keep this specifier constructed and marked `@vite-ignore` so Vite/Rollup
     * does not scan the FS-aware loader into browser bundles that only import
     * `@sys/cell` for descriptor/schema work. Do NOT simplify this string.
     */
    const LOAD_SPEC = './u.' + 'load.ts';
    const { loadCell } = await import(/* @vite-ignore */ LOAD_SPEC);
    return loadCell(root, options);
  },
};
