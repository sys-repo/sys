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
import { CellSchema } from './u.schema/mod.ts';

export const Cell: t.Cell.Lib = {
  Schema: CellSchema,
  Runtime: {
    async check(cell, options) {
      /**
       * Runtime-only service checker import.
       *
       * Keep this specifier constructed and marked `@vite-ignore` so Vite/Rollup
       * does not scan the FS/import-aware runtime checker into browser bundles
       * that only import `@sys/cell` for descriptor/schema work. Do NOT simplify
       * this string.
       */
      const RUNTIME_SPEC = './u.' + 'runtime/mod.ts';
      const { CellRuntime } = await import(/* @vite-ignore */ RUNTIME_SPEC);
      return CellRuntime.check(cell, options);
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
