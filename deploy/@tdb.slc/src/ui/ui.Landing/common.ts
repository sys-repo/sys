import { type t } from '../common.ts';

export * from '../common.ts';
export { Logo } from '../ui.Logo/mod.ts';

/**
 * Constants
 */
export const DEFAULTS = {
  sidebarVisible: false,
  get tubes() {
    const id = 499921561;
    return { id, src: `vimeo/${id}` };
  },
  get canvasPosition(): t.LandingCanvasPosition {
    return 'Center';
  },
} as const;
