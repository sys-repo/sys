import { css, type t } from './common.ts';
import { actionLabel } from './u.actions.ts';
import { EmptyValue } from './ui.EmptyValue.tsx';

/** Stable announcement for the latest supplied result. */
export const Result: t.FC<t.Passkey.ResultProps> = (props) => {
  const { result } = props;
  const labels = {
    success: 'success',
    failure: 'failure',
    indeterminate: 'Outcome unknown',
    'not-submitted': 'Mutation not submitted',
  } as const;

  /**
   * Render:
   */
  const styles = {
    base: css({
      minWidth: 0,
      overflowWrap: 'anywhere',
      whiteSpace: 'normal',
    }),
  };

  return (
    <div role='status' aria-label='Last result' aria-atomic='true' className={styles.base.class}>
      {result
        ? `${actionLabel(result.action)} — ${labels[result.kind]}: ${result.summary}`
        : <EmptyValue />}
    </div>
  );
};
