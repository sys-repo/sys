export * from '../common.ts';

/**
 * Constants:
 */
export const DEFAULTS = {
  variable: true,
  weight: [400],
  italic: false,
  display: 'swap',
  local: [],
  attr: {
    data: 'data-sys-fonts',
    key: 'sys-webfont',
    id: 'sys-fonts',
  },
} as const;
export const D = DEFAULTS;
