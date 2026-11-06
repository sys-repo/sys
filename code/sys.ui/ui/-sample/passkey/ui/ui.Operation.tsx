import { Color, css, D, Spinners, type t } from './common.ts';
import { actionLabel } from './u.actions.ts';

/** Stable operation announcement with a trailing spinner while pending. */
export const Operation: t.FC<t.Passkey.OperationProps> = (props) => {
  const { operation } = props;
  const pending = operation.kind === 'pending';

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      display: 'grid',
      gridTemplateColumns: pending ? `minmax(0, 1fr) ${D.spinner.width}px` : 'minmax(0, 1fr)',
      alignItems: 'center',
      gap: 8,
      minWidth: 0,
    }),
    status: css({ minWidth: 0, overflowWrap: 'anywhere', whiteSpace: 'normal' }),
    spinner: css({
      width: D.spinner.width,
      height: D.spinner.height,
      display: pending ? undefined : 'none',
    }),
  };

  return (
    <div className={styles.base.class}>
      <div role='status' aria-label='Operation' aria-atomic='true' className={styles.status.class}>
        {operation.kind === 'pending'
          ? `${actionLabel(operation.action)}: ${operation.phase}`
          : 'Idle'}
      </div>
      <div data-spinner-slot='' aria-hidden='true' className={styles.spinner.class}>
        {pending && (
          <Spinners.Bar width={D.spinner.width} height={D.spinner.height} theme={theme.name} />
        )}
      </div>
    </div>
  );
};
