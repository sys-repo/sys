import { useEffect } from 'react';
import type { t } from './common.ts';

/**
 * Factory function:
 */
export const makeUseLease: t.MakeUseLease = (lease) => {
  return (key, token) => {
    useEffect(() => {
      if (key === undefined || key === null) return;
      lease.claim(key, token);
      return () => lease.release(key, token);
    }, [key, token]);
  };
};
