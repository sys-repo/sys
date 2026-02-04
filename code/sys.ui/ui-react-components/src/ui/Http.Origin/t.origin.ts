import type { t } from './common.ts';

/**
 * Generic HTTP-origin map.
 */
export type HttpOriginMap = {
  /**
   * TODO 🐷 - make generic
   */
  app: t.StringUrl;
  cdn: { default: t.StringUrl; video: t.StringUrl };
};
