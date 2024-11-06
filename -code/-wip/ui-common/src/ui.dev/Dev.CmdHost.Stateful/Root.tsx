import { DEFAULTS, FC, Filter, type t } from './common.ts';
import { View } from './ui.tsx';

/**
 * Export
 */
type Fields = {
  DEFAULTS: typeof DEFAULTS;
  Filter: typeof Filter;
};
export const CmdHostStateful = FC.decorate<t.CmdHostStatefulProps, Fields>(
  View,
  { DEFAULTS, Filter },
  { displayName: DEFAULTS.displayName },
);
