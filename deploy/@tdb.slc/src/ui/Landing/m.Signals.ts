import { type t, DEFAULTS, Signal } from './common.ts';

type T = t.LandingSignals;
const D = DEFAULTS;

/**
 * Factory: create a new instance of signals
 */
export const signalsFactory: t.LandingSignalsFactory = (defaults = {}) => {
  const s = Signal.create;
  const props: T['props'] = {
    ready: s(false),
  };

  const api: T = {
    props,
  };

  return api;
};
