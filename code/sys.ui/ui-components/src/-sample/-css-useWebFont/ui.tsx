import React from 'react';
import { type t, Color, css } from './common.ts';

import { WebFont, useWebFont } from '@sys/ui-react/use';

export type SampleFontProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Define font(s):
 */
const ET_BOOK = WebFont.def({
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
 * Component:
 */
export const SampleFont: React.FC<SampleFontProps> = (props) => {
  const { debug = false } = props;

  /**
   * Inject ET-Book font once.
   * Folder structure: /public/fonts/et-book/*.woff
   */
  useWebFont('/fonts/et-book', ET_BOOK);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      padding: 20,
      display: 'grid',
      rowGap: 12,
    }),
    title: css({
      fontFamily: '"ET Book", Georgia, serif',
      fontSize: 36,
      lineHeight: 1.2,
    }),
    italic: css({
      fontFamily: '"ET Book", Georgia, serif',
      fontStyle: 'italic',
      fontSize: 24,
      fontWeight: 100,
    }),
  };

  const title = `🐷 ET Book — Regular`;
  const italic = `The quick brown fox jumps over the lazy dog.`;

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>{title}</div>
      <div className={styles.italic.class}>{italic}</div>
    </div>
  );
};
