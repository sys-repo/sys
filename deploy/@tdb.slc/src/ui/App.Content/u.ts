import { type t } from './common.ts';

/**
 * Helpers
 */
const wrangle = {
  breakpoint(state: t.AppSignals) {
    return state.props.breakpoint.value;
  },
} as const;
