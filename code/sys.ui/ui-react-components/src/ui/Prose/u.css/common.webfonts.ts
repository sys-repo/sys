import { WebFont, useWebFont } from '@sys/ui-react/use';

export const ET_BOOK_DIR = '/fonts/et-book';
export const ET_BOOK = WebFont.def({
  family: 'ET Book',
  variable: false,
  weights: [400, 600, 700],
  italic: true,
  local: ['ETBook-Roman', 'ETBook-Italic', 'ETBook-SemiBold', 'ETBook-Bold'],
  fileForStatic: ({ dir, weight, italic }) => {
    if (weight === 400 && !italic) return `${dir}/et-book-roman-old-style-figures.woff`;
    if (weight === 400 && italic) return `${dir}/et-book-display-italic-old-style-figures.woff`;
    if (weight === 600 && !italic) return `${dir}/et-book-semi-bold-old-style-figures.woff`;
    if (weight === 700 && !italic) return `${dir}/et-book-bold-line-figures.woff`;
    return `${dir}/et-book-roman-line-figures.woff`;
  },
});

export function useWebFonts() {
  useWebFont(ET_BOOK_DIR, ET_BOOK);
}
