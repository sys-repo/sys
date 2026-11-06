import { Color, css, type t } from './common.ts';

/** A small, non-alerting warning for a supplied diagnostic message. */
export const Warning: t.FC<t.Passkey.WarningProps> = (props) => {
  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.is.dark ? Color.YELLOW : Color.darken(Color.YELLOW, 25),
      fontSize: 11,
      lineHeight: '1.4em',
      minWidth: 0,
      overflowWrap: 'anywhere',
      whiteSpace: 'normal',
    }),
  };

  return (
    <div
      role='note'
      aria-label={props.ariaLabel}
      className={css(styles.base, props.style).class}
    >
      <span aria-hidden='true'>⚠</span> {props.message}
    </div>
  );
};
