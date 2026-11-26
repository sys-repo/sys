import { Color, css, D, type t } from './common.ts';

export const EventsView: t.FC<t.EventsView.Props> = (props) => {
  const component = D.displayName;
  const theme = Color.theme(props.theme);

  /**
   * Render:
   */
  const styles = {
    base: css({
      backgroundColor: Color.ruby(0),
      color: theme.fg,
      padding: 10,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class} data-component={component}>
      <div>{`🐷 ${D.displayName}`}</div>
    </div>
  );
};
