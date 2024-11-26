import { DEFAULTS as BASE, DevBase, pkg, type t } from '../common.ts';
import { Filter } from './u.Filter.ts';

export { CmdBar } from '../../ui/CmdBar/mod.ts';
export * from '../common.ts';

export const ModuleList = DevBase.ModuleList;

/**
 * Constants
 */
const filter: t.CmdHostFilter = (imports, command) => Filter.imports(imports, command);

export const DEFAULTS = {
  displayName: `${pkg.name}:CmdHost`,
  pkg: { name: 'unknown', version: '0.0.0' },
  filter,
  commandPlaceholder: 'command',
  focusOnReady: true,
  focusOnClick: false,
  autoGrabFocus: true,
  showCommandbar: true,
  qs: BASE.qs,
} as const;
