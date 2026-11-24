import { css, type t } from './common.ts';
import { actionLabel } from './u.actions.ts';
import { EmptyValue } from './ui.EmptyValue.tsx';

/** Stable announcement for the latest supplied result. */
export const Result: t.FC<t.Passkey.ResultProps> = (props) => {
  const { result } = props;
  const level = result && levelOf(result);
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
      ...(level === 'info' && { opacity: 0.5, fontStyle: 'italic', paddingInlineEnd: '2px' }),
      minWidth: 0,
      overflowWrap: 'anywhere',
      whiteSpace: 'normal',
      textWrap: 'pretty',
    }),
  };

  return (
    <div
      role='status'
      aria-label='Last result'
      aria-atomic='true'
      data-level={level}
      className={styles.base.class}
    >
      {result
        ? `${actionLabel(result.action)} — ${labels[result.kind]}: ${result.summary}`
        : <EmptyValue />}
    </div>
  );
};

function levelOf(result: t.Passkey.Result): t.LogLevel {
  switch (result.kind) {
    case 'success':
      return 'info';
    case 'failure':
      return 'error';
    case 'indeterminate':
      return 'warn';
    case 'not-submitted':
      return result.reason === 'cancelled' || result.reason === 'unavailable' ? 'info' : 'warn';
  }
}
