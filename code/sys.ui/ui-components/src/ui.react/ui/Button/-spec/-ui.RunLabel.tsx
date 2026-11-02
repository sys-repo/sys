import { FocusStyle } from '@sys/ui-components/style/focus';
import { Color, css, type t } from '../common.ts';

const indicator: t.Style.Props = {
  position: 'absolute',
  inset: 0,
  borderRadius: 6,
  pointerEvents: 'none',
};
const paint: t.FocusStyle.Paint = {
  arrival: { outlineColor: Color.BLUE },
  settled: { outline: '2px solid currentColor', outlineOffset: '2px' },
  forcedColors: { outline: '2px solid Highlight', outlineOffset: '2px' },
};

/** Independent presentation: accepts a CSS value or final indicator class, never focus state. */
export function RunLabel(props: {
  indicatorOpacity?: t.Style.Props['opacity'];
  indicatorClass?: t.Style.Classname;
}) {
  const styles = {
    body: css({ position: 'relative', display: 'grid', gap: '4px', padding: '10px 14px' }),
    caption: css({ fontSize: 12 }),
    indicator: css({ ...indicator, ...paint.settled, opacity: props.indicatorOpacity ?? 0 }),
  };
  return (
    <div className={styles.body.class}>
      <strong>Run</strong>
      <span className={styles.caption.class}>The child draws this indicator.</span>
      <span aria-hidden='true' className={props.indicatorClass ?? styles.indicator.class} />
    </div>
  );
}

/** Child-owned paint; the composition site binds native host focus using the returned declarations. */
export function runLabelFocus(via: `--${string}`) {
  return FocusStyle.compose({ base: indicator, paint, via });
}
