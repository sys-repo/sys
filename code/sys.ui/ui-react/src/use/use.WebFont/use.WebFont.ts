import { useEffect } from 'react';
import { type t, WebFont } from './common.ts';

export const useWebFont: t.UseWebFont = (dir, opts) => {
  /**
   * Inject font once:
   */
  useEffect(() => {
    WebFont.inject(dir, opts);
  }, []);
};
