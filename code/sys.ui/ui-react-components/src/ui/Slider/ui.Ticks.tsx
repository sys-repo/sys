import React from 'react';
import { Num, css, type t } from './common.ts';
import { Wrangle } from './u.ts';
import { Tick } from './ui.Tick.tsx';

export type TicksProps = {
  ticks: t.SliderTickProps;
  style?: t.CssValue;
};

export const Ticks: React.FC<TicksProps> = (props) => {
  const { ticks } = props;
  const items = Wrangle.tickItems(ticks.items);

  /**
   * [Render]
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
      <div key={i} {...style}>
        {item.el ?? <Tick tick={item} />}
      </div>
    );
  });

  return <div {...css(styles.base, props.style)}>{elItems}</div>;
};

/**
 * Helpers
 */
export function toOffset(input: t.Pixels) {
  return 0 - Math.abs(input);
}
