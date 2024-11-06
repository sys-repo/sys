import { DEFAULTS as BASE } from '../CmdBar/common.ts';
import { pkg } from '../common.ts';

export { Ctrl, Mutate, Path } from '../CmdBar.Ctrl/mod.ts';
export { ObjectView } from '../ObjectView/mod.ts';

export * from '../common.ts';

/**
 * Constants
 */
const name = 'CmdBar.Stateful';
export const DEFAULTS = {
  name,
  displayName: `${pkg.name}:${name}`,
  paths: BASE.paths,
  useHistory: true,
  useKeyboard: BASE.props.useKeyboard,
  focusOnReady: BASE.props.focusOnReady,
  focusBorder: BASE.focusBorder,
} as const;
