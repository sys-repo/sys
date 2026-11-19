import { css, type t } from './common.ts';

/** A subdued dash for an absent value. */
export const EmptyValue: t.FC = () => {
  const styles = { base: css({ opacity: 0.3 }) };
  return <span className={styles.base.class}>-</span>;
};
