import { Wrangle as PropListWrangle } from '../PropList/u.ts';
import { DEFAULTS, type t } from './common.ts';

type P = t.CommonInfoProps;

/**
 * Helpers
 */
export const Wrangle = {
  title(props: P) {
    return PropListWrangle.title(props.title);
  },

  fields(props: P) {
    return PropListWrangle.fields(props.fields);
  },

  width(props: P) {
    return props.width ?? DEFAULTS.width;
  },
} as const;
