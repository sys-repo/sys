import { pkg, type t } from '../common.ts';

export * from '../common.ts';
export { KeyHint } from '../KeyHint/mod.ts';
export { useFocus } from '../../ui.use/mod.ts';

/**
 * Constants
 */
const name = 'CmdBar.Dev';
export const DEFAULTS = {
  name,
  displayName: `${pkg.name}:${name}`,
  Main: {
    fields: {
      get all(): t.MainField[] {
        return ['Module.Args', 'Module.Run'];
      },
      get default(): t.MainField[] {
        return DEFAULTS.Main.fields.all;
      },
    },
  },
} as const;
