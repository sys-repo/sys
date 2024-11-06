import { Color, css, type t } from '../common.ts';
import { Util } from './u.ts';

export type HintProps = {
  valueStyle: t.TextInputStyle;
  value: string;
  hint: string | JSX.Element;
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

/**
 * Used for displaying an auto-complete "hint".
 */
export const Hint: React.FC<HintProps> = (props) => {
  const { value, hint, valueStyle } = props;
  const isString = typeof hint === 'string';
  const fontProps = Util.Css.pluckFont(valueStyle);

  /**
   * [Render]
   */
  const color = Color.theme(props.theme).fg;
  const styles = {
    base: css({
      Absolute: 0,
      pointerEvents: 'none',
      display: 'grid',
      gridTemplateColumns: `auto 1fr`,
      alignContent: 'center',
      color,
    }),
    value: css({
      ...fontProps,
      boxSizing: 'border-box',
      paddingLeft: 2,
      opacity: 1, // NB: Hidden (placeholder that pushes out the "hint" to the right)
    }),
    hint: css({
      ...fontProps,
      boxSizing: 'border-box',
      marginLeft: 1,
      opacity: isString ? 0.3 : 1,
    }),
  };

  return (
    <div {...css(styles.base, props.style)}>
      <div {...styles.value}>{value}</div>
      <div {...styles.hint}>{hint}</div>
    </div>
  );
};
