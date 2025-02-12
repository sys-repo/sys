import { useRef } from 'react';
import { COLORS, css, type t } from '../common.ts';

export type RenderCountProps = {
  absolute?: t.CssValue['Absolute'];
  prefix?: string;
  style?: t.CssValue;
};

export const RenderCount: React.FC<RenderCountProps> = (props) => {
  const { prefix = 'render-' } = props;
  const countRef = useRef(0);
  countRef.current++;

  /**
   * [Render]
   */
  const styles = {
    base: css({
      Absolute: Wrangle.absolute(props.absolute),
      pointerEvents: 'none',
      color: COLORS.DARK,
      fontSize: 11,
      opacity: 0.6,
    }),
  };

  const text = `${prefix}${countRef.current}`;
  return <div style={css(styles.base, props.style)}>{text}</div>;
};

/**
 * [Helpers]
 */

const Wrangle = {
  absolute(input: RenderCountProps['absolute']): t.CssValue['Absolute'] {
    if (!input || !Array.isArray(input)) return [3, 4, null, null];
    if (input.length === 2) return [input[0], input[1], null, null];
    return input.slice(0, 3) as t.CssValue['Absolute'];
  },
};
