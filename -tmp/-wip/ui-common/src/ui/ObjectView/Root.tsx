import { DEFAULTS, FC, type t } from './common.ts';
import { View } from './ui.tsx';

const { formatter } = DEFAULTS;

type Fields = {
  DEFAULTS: typeof DEFAULTS;
  formatter: typeof formatter;
};
export const ObjectView = FC.decorate<t.ObjectViewProps, Fields>(
  View,
  { DEFAULTS, formatter },
  { displayName: DEFAULTS.displayName },
);
