import { type t } from './common.ts';

/**
 * Toggle a boolean signal.
 */
export const toggle: t.SignalLib['toggle'] = (signal, forceValue) => {
  const next = typeof forceValue === 'boolean' ? forceValue : !signal.value;
  signal.value = next;
  return next;
};
