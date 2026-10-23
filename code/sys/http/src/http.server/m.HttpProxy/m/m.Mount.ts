import type { t } from '../common.ts';

/** Durable reverse-proxy mount owner affordances. */
export const Mount: t.HttpProxy.Mount.Lib = Object.freeze({
  async add(input) {
    const { add } = await import('../u.config/u.mount.add.ts');
    return await add(input);
  },
});
