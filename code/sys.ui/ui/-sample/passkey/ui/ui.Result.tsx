import { css, type t } from './common.ts';
import { actionLabel } from './u.actions.ts';
import { EmptyValue } from './ui.EmptyValue.tsx';

/** Stable announcement for the latest supplied result. */
export const Result: t.FC<t.Passkey.ResultProps> = (props) => {
  const { result } = props;

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
        ? `${actionLabel(result.action)} — ${result.kind}: ${result.summary}`
        : <EmptyValue />}
    </div>
  );
};
