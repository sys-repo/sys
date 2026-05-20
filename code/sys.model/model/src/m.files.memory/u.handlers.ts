import { type t } from './common.ts';
import { translate } from './u.error.ts';

export const handlers = (
  base: t.FilesCmd.HandlerMap,
  capabilities: t.Files.Capabilities,
): t.FilesCmd.HandlerMap => {
  return Object.freeze({
    'files:capabilities'() {
      return capabilities;
    },

    'files:list'(payload, context) {
      return attempt(() => base['files:list'](payload, context));
    },

    'files:stat'(payload, context) {
      return attempt(() => base['files:stat'](payload, context));
    },

    'files:read'(payload, context) {
      return attempt(() => base['files:read'](payload, context));
    },

    'files:watch'(payload, context) {
      return attempt(() => base['files:watch'](payload, context));
    },

    async 'files:manifest'(payload, context) {
      const manifest = await attempt(() => base['files:manifest'](payload, context));
      return { ...manifest, capabilities };
    },
  });
};

async function attempt<T>(fn: () => t.Awaitable<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw translate(error);
  }
}
