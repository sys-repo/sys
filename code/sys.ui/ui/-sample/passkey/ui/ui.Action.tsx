import { Button, Color, css, KeyValue, type t } from './common.ts';
import { Warning } from './ui.Warning.tsx';

/** Canonical button and its unavailable-action explanation. */
export const Action: t.FC<t.Passkey.ActionProps> = (props) => {
  const { label, reason, pending, onClick, variant } = props;
  const button = {
    label,
    enabled: !pending && !reason,
    tooltip: reason,
    'aria-describedby': props['aria-describedby'],
    onClick,
  };

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      display: 'grid',
      justifyItems: 'end',
      gap: 4,
      minWidth: 0,
      overflowWrap: 'anywhere',
      whiteSpace: 'normal',
    }),
  };

  return (
    <div className={styles.base.class}>
      {variant === 'text'
        ? <Button {...button} theme={theme.name} />
        : <KeyValue.ActionButton {...button} />}
      {!pending && reason && (
        <Warning message={reason} ariaLabel='Action unavailable' theme={theme.name} />
      )}
    </div>
  );
};
