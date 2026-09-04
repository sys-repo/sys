import { Color, css, D, type t } from './common.ts';

export const AppShell: t.FC<t.AppShell.Props> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      minHeight: 0,
      minWidth: 0,
      placeItems: 'center',
    }),
    title: css({ opacity: 0.4 }),
  };

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      <div className={styles.title.class}>{D.displayName}</div>
    </div>
  );
};
