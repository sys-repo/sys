import React from 'react';
import { type t, Color, css, Slider } from './common.ts';

/**
 * Component:
 */
export const Filter: React.FC<t.FilterProps> = (props) => {
  const { min, max } = props;

  const percent = RangePercent.toPercent(props.value ?? 0, [min, max]); // → 0.75
  const value = RangePercent.fromPercent(percent, [min, max]); // → 150

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
      marginBottom: 0,
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
          const value = RangePercent.fromPercent(percent, [min, max]);
          props.onChange?.({ percent, value });
        }}
      />
    </div>
  );
};

