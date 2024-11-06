import type { t } from '../common.ts';

/**
 * Internal types.
 */
export type PropArgs = {
  events: t.DevEvents;
  current: () => t.DevRenderProps;
  changed: () => void;
};
