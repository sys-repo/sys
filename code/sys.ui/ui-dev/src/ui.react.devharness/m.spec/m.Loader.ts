import { type t } from './common.ts';

/**
 * Parameterized spec loader.
 */
export const Loader: t.Loader.Lib = {
  load(from, ...args) {
    return async () => {
      const mod = await from();
      const params = args[0];
      const hasParams = args.length > 0;

      if (!hasParams && mod.default) return { default: mod.default };

      if (typeof mod.createSpec === 'function') {
        const suite = await mod.createSpec(params as never);
        return { default: suite };
      }

      if (hasParams) {
        throw new Error('Expected module to export { createSpec } when params were provided.');
      }

      throw new Error('Expected module to export { default } or { createSpec }.');
    };
  },
};
