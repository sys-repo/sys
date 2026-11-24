import { Color, css, KeyValue, type t } from './common.ts';
import { Warning } from './ui.Warning.tsx';

/** Canonical button and its unavailable-action explanation. */
export const Action: t.FC<t.Passkey.ActionProps> = (props) => {
  const { label, reason, advisory, pending, onClick } = props;

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
      {!reason && !pending && advisory && (
        <Warning message={advisory} ariaLabel='Before registering a passkey' theme={theme.name} />
      )}
      <KeyValue.ActionButton
        label={label}
        enabled={!pending && !reason}
        tooltip={reason ?? advisory}
        onClick={onClick}
      />
      {!pending && reason && (
        <Warning message={reason} ariaLabel='Action unavailable' theme={theme.name} />
      )}
    </div>
  );
};
