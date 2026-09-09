import { WebFont } from './common.ts';

export const ET_BOOK = WebFont.def({
  family: 'ET Book',
  variable: false,
  weights: [400, 600, 700],
  italic: true,
  local: ['ETBook-Roman', 'ETBook-Italic', 'ETBook-SemiBold', 'ETBook-Bold'],
  fileForStatic: ({ dir, family, weight, italic }) => {
    // Example: matching filenames exactly:
    if (weight === 400 && !italic) return `${dir}/et-book-roman-old-style-figures.woff`;
    if (weight === 400 && italic) return `${dir}/et-book-display-italic-old-style-figures.woff`;
    if (weight === 600 && !italic) return `${dir}/et-book-semi-bold-old-style-figures.woff`;
    if (weight === 700 && !italic) return `${dir}/et-book-bold-line-figures.woff`;
    return `${dir}/et-book-roman-line-figures.woff`; // fallback
  },
});

/**
 * Constants:
 */
export const FONTS = { ET_BOOK } as const;
