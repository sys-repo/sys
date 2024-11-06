import { DEFAULTS as BASE, pkg, type t } from '../common.ts';
import { Filter } from '../Dev.CmdHost/u.Filter.ts';

export * from '../common.ts';
export { Filter };

/**
 * Constants
 */
const filter: t.CmdHostFilter = (imports, command) => {
  return Filter.imports(imports, command, { maxErrors: 1 });
};

const name = 'CmdHost.Stateful';
export const DEFAULTS = {
  displayName: `${pkg.name}:${name}`,
  filter,
  qs: BASE.qs,
} as const;
