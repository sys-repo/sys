import { DEFAULTS, FC, type t } from './common.ts';
import { View } from './ui.tsx';

/**
 * Export
 */
type Fields = {
  DEFAULTS: typeof DEFAULTS;
};
export const ModuleList = FC.decorate<t.ModuleListProps, Fields>(
  View,
  { DEFAULTS },
  { displayName: DEFAULTS.displayName },
);
