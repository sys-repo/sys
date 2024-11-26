import { DEFAULTS, FC, css, type t } from './common.ts';

const View: React.FC<t.FlipProps> = (props) => {
  const { flipped = false, speed = DEFAULTS.speed } = props;

  /**
   * Render
   */
  const styles = {
    base: css({ position: 'relative', perspective: 1000, display: 'grid' }),
    body: css({
      gridRow: 1,
      gridColumn: 1,
      boxSizing: 'border-box',
      backfaceVisibility: 'hidden',
      transition: `transform ${speed}ms ease-out`,
      display: 'grid',
    }),
    front: css({ display: 'grid', transform: `rotateY(${flipped ? -180 : 0}deg)` }),
    back: css({ display: 'grid', transform: `rotateY(${flipped ? 0 : 180}deg)` }),
  };

  const elFront = props.front && <div {...css(styles.body, styles.front)}>{props.front}</div>;
  const elBack = props.back && <div {...css(styles.body, styles.back)}>{props.back}</div>;

  return (
    <div {...css(styles.base, props.style)}>
      {elFront}
      {elBack}
    </div>
  );
};

/**
 * Export
 */
type Fields = { DEFAULTS: typeof DEFAULTS };
export const Flip = FC.decorate<t.FlipProps, Fields>(
  View,
  { DEFAULTS },
  { displayName: DEFAULTS.displayName },
);
