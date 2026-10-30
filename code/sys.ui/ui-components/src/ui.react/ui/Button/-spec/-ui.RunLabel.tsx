import { css, type t } from '../common.ts';

/** Independent presentation: the caller supplies a CSS value, not focus state. */
export function RunLabel(props: { indicatorOpacity?: t.Style.Props['opacity'] }) {
  const styles = {
    body: css({ position: 'relative', display: 'grid', gap: '4px', padding: '10px 14px' }),
    caption: css({ fontSize: 12 }),
    indicator: css({
      position: 'absolute',
      inset: 0,
      borderRadius: 6,
      outline: '2px solid currentColor',
      outlineOffset: '2px',
      opacity: props.indicatorOpacity ?? 0,
      pointerEvents: 'none',
    }),
  };
  return (
    <div className={styles.body.class}>
      <strong>Run</strong>
      <span className={styles.caption.class}>The child draws this indicator.</span>
      <span aria-hidden='true' className={styles.indicator.class} />
    </div>
  );
}
