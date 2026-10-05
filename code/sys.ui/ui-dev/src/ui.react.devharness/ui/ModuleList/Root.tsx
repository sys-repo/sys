import { DEFAULTS, FC, type t } from './common.ts';
import { View } from './ui.tsx';

/**
 * Export
 */
type Fields = t.ModuleListComponentFields;

/**
 * Renders a listing of test/spec modules.
 */
export const ModuleList: t.ModuleListComponent = FC.decorate<t.ModuleListProps, Fields>(
  View,
  { DEFAULTS },
  { displayName: DEFAULTS.displayName },
);
