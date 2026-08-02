import type { t } from '../common.ts';

/** Durable reverse-proxy config owner affordances. */
export const Config: t.HttpProxy.Config.Lib = {
  async add(input) {
    const { add } = await import('../u.config/u.add.ts');
    return await add(input);
  },
};
