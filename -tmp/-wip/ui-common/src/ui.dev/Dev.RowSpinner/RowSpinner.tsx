import { COLORS, Spinner, Style, css, type t } from '../common';

export type RowSpinnerProps = {
  margin?: t.CssEdgesInput;
  width?: number;
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

export const RowSpinner: React.FC<RowSpinnerProps> = (props) => {
  const { width = 60, theme = 'Light' } = props;
  const color = theme === 'Light' ? COLORS.DARK : COLORS.WHITE;

  /**
   * Render
   */
  const styles = {
    base: css({
      ...Style.toMargins(props.margin),
      position: 'relative',
      PaddingY: 10,
      display: 'grid',
      placeItems: 'center',
    }),
  };

  return (
    <div {...css(styles.base, props.style)}>
      <Spinner.Bar width={width} color={color} />
    </div>
  );
};
