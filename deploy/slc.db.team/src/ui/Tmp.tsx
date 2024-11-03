import { COLORS, Color, css, type t } from './common.ts';

export type TmpProps = {
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

export const Tmp: React.FC<TmpProps> = (props) => {
  const {} = props;

  /**
   * Render
   */
  const theme = Color.theme(props.theme ?? 'Dark');
  const styles = {
    base: css({
      backgroundColor: COLORS.MAGENTA,
      color: theme.fg,
      fontFamily: 'sans-serif',
      Absolute: 0,

      display: 'grid',
      placeItems: 'center',
    }),
    pig: css({ fontSize: 56 }),
    title: css({ fontSize: 28 }),
  };

  return (
    <div {...css(styles.base, props.style)}>
      <div>
        <div {...styles.pig}>{`🐷`}</div>
        <div {...styles.title}>{`Social Lean Canvas`}</div>
      </div>
    </div>
  );
};
