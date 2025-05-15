import React from 'react';
import { type t, Color, css, Num, Slider } from './common.ts';

const { toPercent, fromPercent } = Num.Percent.Range;
type P = t.MediaFilterProps;

/**
 * Component:
 */
export const Filter: React.FC<P> = (props) => {
  const { range } = props;
  const [min, max] = range;
  const percent = toPercent(props.value ?? 0, [min, max]);
  const value = fromPercent(percent, range);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      userSelect: 'none',
      display: 'grid',
      fontSize: 14,
    }),
    title: css({
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      marginBottom: 3,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>
        <div>{props.label}</div>
        <div />
        <div>{`${value.toFixed()}${props.unit}`}</div>
      </div>
      <Slider
        theme={theme.name}
        percent={percent}
        track={{ height: 5 }}
        thumb={{ size: 15 }}
        onChange={(e) => {
          const { percent } = e;
          const value = fromPercent(percent, [min, max]);
          props.onChange?.({ percent, value });
        }}
      />
    </div>
  );
};
