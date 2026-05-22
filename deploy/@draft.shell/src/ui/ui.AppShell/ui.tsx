import { Color, css, D, type t } from './common.ts';

export const AppShell: t.FC<t.AppShell.Props> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(0),
      color: theme.fg,
      padding: 10,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      <div>{`🐷 ${D.displayName}`}</div>
    </div>
  );
};
