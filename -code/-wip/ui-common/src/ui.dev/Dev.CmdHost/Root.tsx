import { CmdHostStateful as Stateful } from '../Dev.CmdHost.Stateful';
import { DEFAULTS, FC, type t } from './common';
import { Filter } from './u';
import { View } from './ui';

/**
 * Export
 */
type Fields = {
  DEFAULTS: typeof DEFAULTS;
  Stateful: typeof Stateful;
  Filter: typeof Filter;
};
export const CmdHost = FC.decorate<t.CmdHostProps, Fields>(
  View,
  { DEFAULTS, Stateful, Filter },
  { displayName: DEFAULTS.displayName },
);
