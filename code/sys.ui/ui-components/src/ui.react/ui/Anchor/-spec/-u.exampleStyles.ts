import { Color, css } from './common.ts';

/**
 * Captions sit with their examples; separators own the space between them.
 */
export function exampleStyles(foreground: string) {
  return {
    example: css({ display: 'grid', gap: '10px' }),
    label: css({ fontSize: 12, opacity: 0.2 }),
    divider: css({
      Margin: [14, -10, 10, -10],
      height: 3,
      backgroundColor: Color.alpha(foreground, 0.1),
      pointerEvents: 'none',
    }),
  };
}
