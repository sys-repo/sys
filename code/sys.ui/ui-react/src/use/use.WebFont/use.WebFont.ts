import { useEffect } from 'react';
import { type t, WebFont } from './common.ts';

/** Inject a web-font bundle during the component lifecycle. */
export const useWebFont: t.UseWebFont = (dir, opts) => {
  const family = opts.family;
  const variable = opts.variable ?? true;
  const italic = opts.italic ?? false;
  const display = opts.display ?? 'swap';
  const weights = opts.weights ?? [400];
  const local = opts.local ?? [];
  const weightsKey = weights.join(',');
  const localKey = local.join(',');

  /**
   * Inject font for the current args.
   * Re-runs only when semantic config values change.
   */
  useEffect(() => {
    WebFont.inject(dir, opts);
  }, [dir, family, variable, italic, display, weightsKey, localKey]);
};
