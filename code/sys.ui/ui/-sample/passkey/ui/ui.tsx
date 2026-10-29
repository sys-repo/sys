import { Color, css, D, type t } from './common.ts';

/**
 * Render the passkey spike's initial UI shell.
 */
export const Passkey: t.FC<t.Passkey.Props> = (props) => {
  const { debug = D.debug } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug ? 0.1 : 0),
      color: theme.fg,
      padding: 10,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      <div>{D.displayName}</div>
    </div>
  );
};
