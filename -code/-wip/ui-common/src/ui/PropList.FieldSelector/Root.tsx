import { FieldBuilder } from '../PropList/FieldBuilder.ts';
import { DEFAULTS, FC, type t } from './common.ts';
import { View } from './ui.tsx';

/**
 * Export
 */
type Fields = {
  DEFAULTS: typeof DEFAULTS;
  FieldBuilder: typeof FieldBuilder;
};
export const FieldSelector = FC.decorate<t.PropListFieldSelectorProps, Fields>(
  View,
  { DEFAULTS, FieldBuilder },
  { displayName: DEFAULTS.displayName },
);
