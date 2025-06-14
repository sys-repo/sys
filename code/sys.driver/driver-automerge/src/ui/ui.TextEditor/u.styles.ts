import { type t, css } from './common.ts';

export const Headline = {
  DmSerif: {
    regular: css({ fontFamily: '"DM Serif Display", serif', fontWeight: 400, fontStyle: 'normal' }),
    italic: css({ fontFamily: '"DM Serif Display", serif', fontWeight: 400, fontStyle: 'italic' }),
  },
};

/**
 * Set the styles of elmeents within a ProseMirror document:
 */
export const EditorStyles = {
  body(base?: t.CssInput) {
    return css(base)
      .rule('.ProseMirror', {
        height: '100%',
        outline: 'none', // NB: remove blue outline glow.
        font: 'inherit',
        whiteSpace: 'pre-wrap',
        boxSizing: 'border-box',
      })
      .rule('.ProseMirror > :first-child', {
        marginBlockStart: 0, // NB: supress first element top-margin.
      })
      .rule('.ProseMirror > :last-child', {
        marginBlockEnd: 0, // NB: supress last element top-margin.
      })
      .rule('.ProseMirror > H1', {
        fontSize: '4.3em',
        ...Headline.DmSerif.regular.style,
      })
      .rule('.ProseMirror > P', {
        lineHeight: '1.7em',
        fontSize: '1.3em',
      });
  },
} as const;
