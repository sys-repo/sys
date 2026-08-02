import type { t } from '../common.ts';

/** Durable reverse-proxy root/default route owner affordances. */
export const Root: t.HttpProxy.Root.Lib = {
  async set(input) {
    const { set } = await import('../u.config/u.root.set.ts');
    return await set(input);
  },
};
