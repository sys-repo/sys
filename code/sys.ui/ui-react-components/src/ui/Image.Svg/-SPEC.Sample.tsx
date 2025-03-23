import React from 'react';

import StaticLarger from '../../-sample/images/sample.larger.svg';
import StaticSmall from '../../-sample/images/sample.small.svg';

import type { DebugImage, DebugImportStyle, DebugSignals } from './-SPEC.Debug.tsx';
import { type t, Signal } from './common.ts';
import { Svg } from './mod.ts';

export type SampleProps = { signals: DebugSignals };

/**
 * SAMPLE: render an SVG within a React component.
 */
export const Sample: React.FC<SampleProps> = (props) => {
  const { signals } = props;
  const p = signals.props;
  const width = p.width.value;
  const input = wrangle.importInput(p.importStyle.value, p.image.value);

  type H = HTMLDivElement;
  const viewbox = wrangle.size(p.image.value);
  const svg = Svg.useSvg<H>(input, viewbox, (e) => e.draw.width(width));

  console.groupCollapsed(`🌳 SVG (hook)`);
  console.info(svg);
  console.info('input:', input);
  console.info(`svg.query('#tick'):`, svg.query('#tick'));
  console.info(`svg.queryAll('line'):`, svg.queryAll('line'));
  console.groupEnd();

  /**
   * Redraw the component on signal changes.
   */
  Signal.useRedrawEffect(() => {
    p.width.value;
    p.theme.value;
    p.color.value;
    p.image.value;
    p.importStyle.value;
  });

  /**
   * Dynamically adjust the SVG on signal changes.
   */
  Signal.useEffect(() => {
    const width = p.width.value;
    const color = p.color.value;

    const draw = svg.draw;
    if (!draw) return;

    draw.width(width);
    const tick = draw.findOne('#tick');
    const borderOutline = draw.findOne('#border-outline');

    if (tick) {
      tick.attr({ opacity: color === 'dark' ? 1 : 0.2 });
    }
    if (borderOutline) {
      borderOutline.attr({ stroke: width === 200 ? '#383057' : '#0000FF' });
    }
  });

  /**
   * Render:
   */
  return <div ref={svg.ref} />;
};

/**
 * Helpers
 */
const wrangle = {
  importInput(importStyle: DebugImportStyle, image: DebugImage = 'Small'): t.SvgImportInput {
    if (importStyle === 'Static') {
      return image === 'Small' ? StaticSmall : StaticLarger;
    }

    if (importStyle === 'Function → Promise') {
      return image === 'Small'
        ? () => import('../../-sample/images/sample.small.svg')
        : () => import('../../-sample/images/sample.larger.svg');
    }

    throw new Error(`Import style "${importStyle}" not supported.`);
  },

  size(image: DebugImage) {
    if (image === 'Small') return [1059, 1059];
    if (image === 'Larger') return [233, 98];
    throw new Error(`Image "${image}" not supported.`);
  },
} as const;
