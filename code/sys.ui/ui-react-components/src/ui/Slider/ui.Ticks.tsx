import React from 'react';
import { type t, Color, Num, css } from './common.ts';
import { Wrangle } from './u.ts';
import { Tick } from './ui.Tick.tsx';

export type TicksProps = {
  ticks: t.SliderTickProps;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export const Ticks: React.FC<TicksProps> = (props) => {
  const { ticks } = props;
  const items = Wrangle.tickItems(ticks.items);

  /**
   * Render:
   */
  const top = toOffset(ticks.offset.top);
  const bottom = toOffset(ticks.offset.bottom);
  const styles = {
    base: css({ Absolute: [top, 0, bottom, 0] }),
    item: css({ Absolute: [0, null, 0, null] }),
  };

  const elItems = items.map((item, i) => {
    const left = Num.Percent.toString(item.value);
    const style = css(styles.item, { left });
    return (
      <div key={i} className={style.class}>
        {item.el ?? <Tick tick={item} />}
      </div>
    );
  });

  return <div className={css(styles.base, props.style).class}>{elItems}</div>;
};

/**
 * Helpers:
 */
function toOffset(input: t.Pixels) {
  return 0 - Math.abs(input);
}
