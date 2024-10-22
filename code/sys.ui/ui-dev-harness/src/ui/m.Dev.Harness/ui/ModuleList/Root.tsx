import { DEFAULTS, FC, type t } from './common.ts';
import { View } from './ui.tsx';

/**
 * Export
 */
type Fields = {
  DEFAULTS: t.ModuleListDefaults;
};
export const ModuleList = FC.decorate<t.ModuleListProps, Fields>(
  View,
  { DEFAULTS },
  { displayName: DEFAULTS.displayName },
);
