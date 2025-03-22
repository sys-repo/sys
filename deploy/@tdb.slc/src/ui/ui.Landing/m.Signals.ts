import { type t, DEFAULTS, Signal } from './common.ts';

type T = t.LandingSignals;
const D = DEFAULTS;

/**
 * Factory: create a new instance of signals
 */
export const signalsFactory: t.LandingSignalsFactory = (defaults = {}) => {
  const s = Signal.create;
  const props: T['props'] = {
    ready: s<boolean>(false),
    sidebarVisible: s<boolean>(defaults.sidebarVisible ?? D.sidebarVisible),
    canvasPosition: s<t.LandingCanvasPosition>(defaults.canvasPosition ?? D.canvasPosition),
  };
  const api: T = { props };
  return api;
};
