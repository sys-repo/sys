import { type t } from '../common.ts';

/** Overlay capability facts onto a Files Cmd handler map. */
export const withCapabilities = (
  handlers: t.Files.Cmd.HandlerMap,
  capabilities: t.Files.Capabilities,
): t.Files.Cmd.HandlerMap => {
  return Object.freeze({
    ...handlers,
    'files:capabilities': () => capabilities,
    'files:manifest': async (payload, context) => {
      const manifest = await handlers['files:manifest'](payload, context);
      return { ...manifest, capabilities };
    },
  });
};
