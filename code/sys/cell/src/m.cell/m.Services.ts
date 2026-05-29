import type { t } from './common.ts';

export const Services: t.Cell.Services.Lib = {
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
  async resources(cell, options) {
    /**
     * Services-only resource planner import.
     *
     * Keep this specifier constructed and marked `@vite-ignore` so Vite/Rollup
     * does not scan FS/import-aware services helpers into browser bundles
     * that only import `@sys/cell` for descriptor/schema work. Do NOT simplify
     * this string.
     */
    const SERVICES_SPEC = './u.' + 'services/mod.ts';
    const { CellServices } = await import(/* @vite-ignore */ SERVICES_SPEC);
    return CellServices.resources(cell, options);
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
};
