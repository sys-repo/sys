import React from 'react';
import Image from '../../../public/images/sample/svg.sample.svg';

import type { DebugSignals } from './-SPEC.Debug.tsx';
import { Signal } from './common.ts';
import { Svg } from './mod.ts';

export type SampleProps = { signals: DebugSignals };

export const Sample: React.FC<SampleProps> = (props) => {
  const { signals } = props;
  const p = signals.props;

  const svg = Svg.useSvg<HTMLDivElement>(Image, (draw) => draw.width(200));
  const draw = svg.draw;

  Signal.useRedrawEffect(() => {
    p.width.value;
    p.theme.value;
    p.color.value;
  });

  Signal.useSignalEffect(() => {
    const width = p.width.value;
    const color = p.color.value;

    if (!draw) return;
    draw.width(p.width.value);

    const tick = draw.findOne('#tick');
    const borderOutline = draw.findOne('#border-outline');

    if (tick) {
      tick?.attr({ opacity: color === 'dark' ? 1 : 0.2 });
    }
    if (borderOutline) {
      borderOutline.attr({
        stroke: width === 200 ? '#383057' : '#0000FF',
      });
    }
  });

  return <div ref={svg.ref} />;
};
