import { useEffect } from 'react';
import { type t, WebFont } from './common.ts';

export const useWebFont: t.UseWebFont = (dir, opts) => {
  /**
   * Inject font for the current args.
   * Re-runs when dir/config identity changes.
   */
  useEffect(() => {
    WebFont.inject(dir, opts);
  }, [dir, opts]);
};
