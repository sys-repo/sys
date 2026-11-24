import { css } from './common.ts';

/**
 * Captions sit with their examples; separators own the space between them.
 */
export function exampleStyles() {
  return {
    example: css({ display: 'grid', gap: '10px' }),
    label: css({ fontSize: 12, opacity: 0.2 }),
  };
}
