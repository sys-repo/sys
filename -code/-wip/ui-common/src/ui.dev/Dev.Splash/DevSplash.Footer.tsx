import { css, type t } from './common';

type C = string | JSX.Element | null;
export type FooterInput = C | [C, C] | [C, C, C];
export type FooterContent = [C, C, C];

export type FooterProps = {
  content?: FooterInput;
  style?: t.CssValue;
};

export const Footer: React.FC<FooterProps> = (props) => {
  const content = Wrangle.content(props.content);

  /**
   * [Render]
   */
  const styles = {
    base: css({
      cursor: 'default',
      boxSizing: 'border-box',
      padding: 10,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
    }),
    block: css({}),
    left: css({}),
    middle: css({
      display: 'grid',
      placeItems: 'center',
    }),
    right: css({
      display: 'grid',
      justifyContent: 'right',
      alignContent: 'center',
    }),
  };

  return (
    <div {...css(styles.base, props.style)}>
      <div {...css(styles.block, styles.left)}>{content[0]}</div>
      <div {...css(styles.block, styles.middle)}>{content[1]}</div>
      <div {...css(styles.block, styles.right)}>{content[2]}</div>
    </div>
  );
};

/**
 * [Helpers]
 */

const Wrangle = {
  content: (input?: FooterInput): FooterContent => {
    if (typeof input === 'string') return [null, null, input];
    if (Array.isArray(input)) return [input[0] ?? null, input[1] ?? null, input[2] ?? null];
    return [null, null, null];
  },
};
