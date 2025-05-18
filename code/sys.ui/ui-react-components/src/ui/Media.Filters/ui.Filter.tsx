import React from 'react';
import { type t, Color, css, Num, Slider } from './common.ts';

type P = t.MediaFilterProps;
const { toPercent, fromPercent } = Num.Percent.Range;

/**
 * Component:
 */
export const Filter: React.FC<P> = (props) => {
  const { name, range, debug = false } = props;
  const label = props.label ?? props.name ?? 'Unnamed';
  const percent = toPercent(props.value ?? 0, range);
  const value = fromPercent(percent, range);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
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
        <div>{label}</div>
        <div />
        <div>{`${value.toFixed()}${wrangle.displayUnit(props)}`}</div>
      </div>
      <Slider
        theme={theme.name}
        percent={percent}
        track={{ height: 5 }}
        thumb={{ size: 15 }}
        onChange={(e) => {
          const { percent } = e;
          const value = fromPercent(percent, range);
          props.onChange?.({ name, percent, value });
        }}
      />
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  displayUnit(props: P) {
    const { unit } = props;
    if (unit === 'deg') return '°';
    return unit;
  },
} as const;
