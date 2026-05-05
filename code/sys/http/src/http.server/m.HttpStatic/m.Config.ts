import type { t } from './common.ts';

/** Durable static-server config owner affordances. */
export const Config: t.HttpStatic.ConfigLib = {
  async add(input) {
    const { add } = await import('./u.config.add.ts');
    return await add(input);
  },
};
