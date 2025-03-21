import { type t } from '../common.ts';
export * from '../common.ts';

/**
 * Constants
 */
export const DEFAULTS = {
  get tubes() {
    const id = 499921561;
    return { id, src: `vimeo/${id}` };
  },
  get canvasPosition(): t.LandingCanvasPosition {
    return 'Center';
  },
} as const;
