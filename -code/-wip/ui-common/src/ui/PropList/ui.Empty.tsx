import { Color, DEFAULTS, css, type t } from './common.ts';

export type EmptyProps = {
  text?: string;
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

export const Empty: React.FC<EmptyProps> = (props) => {
  const { text = 'Nothing to display.' } = props;

  /**
   * Render
   */
  const theme = Color.theme(props.theme ?? DEFAULTS.theme);
  const styles = {
    base: css({
      fontSize: 14,
      fontStyle: 'italic',
      color: theme.is.light ? theme.alpha(0.4).fg : theme.alpha(0.6).fg,
      paddingTop: 8,
      display: 'grid',
      placeItems: 'center',
    }),
  };

  return (
    <div {...css(styles.base, props.style)}>
      <div>{text}</div>
    </div>
  );
};
