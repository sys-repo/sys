import { useRef } from 'react';
import { COLORS, css, type t } from '../common.ts';

export const RenderCount: React.FC<t.RenderCountProps> = (props) => {
  const { prefix = 'render-', theme = 'Light', opacity = 0.6 } = props;
  const countRef = useRef(0);
  countRef.current++;

  /**
   * [Render]
   */
  const styles = {
    base: css({
      Absolute: Wrangle.absolute(props.absolute),
      pointerEvents: 'none',
      fontSize: 11,
      color: theme === 'Dark' ? COLORS.WHITE : COLORS.DARK,
      opacity,
    }),
  };

  const text = `${prefix}${countRef.current}`;
  return <div {...css(styles.base, props.style)}>{text}</div>;
};

/**
 * [Helpers]
 */

const Wrangle = {
  absolute(input: t.RenderCountProps['absolute']): t.CssValue['Absolute'] {
    if (!input || !Array.isArray(input)) return [3, 4, null, null];
    if (input.length === 2) return [input[0], input[1], null, null];
    return input.slice(0, 4) as t.CssValue['Absolute'];
  },
};
