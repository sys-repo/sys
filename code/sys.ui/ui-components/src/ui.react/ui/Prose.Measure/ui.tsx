import { type t, Color, css, D } from './common.ts';

export const Measure: t.FC<t.ProseMeasure.Props> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      padding: 10,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      {`🐷 ${D.displayName} `}
    </div>
  );
};
