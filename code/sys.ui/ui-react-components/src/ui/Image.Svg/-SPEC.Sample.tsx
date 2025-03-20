import React from 'react';
import StaticImport from '../../-test/sample/images/svg.sample.svg';

import type { DebugSignals, DebugImportStyle } from './-SPEC.Debug.tsx';
import { type t, Signal } from './common.ts';
import { Svg } from './mod.ts';

export type SampleProps = { signals: DebugSignals };

/**
 * SAMPLE: render an SVG within a React component.
 */
export const Sample: React.FC<SampleProps> = (props) => {
  const { signals } = props;
  const p = signals.props;

  const input = wrangle.importInput(p.importStyle.value);
  const svg = Svg.useSvg<HTMLDivElement>(input, 1059, 1059, (e) => e.draw.width(p.width.value));

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
  importInput(style: DebugImportStyle): t.SvgImportInput {
    if (style === 'Static') return StaticImport;
    if (style === 'Function → Promise') {
      return () => import('../../-test/sample/images/svg.sample.svg');
    }
    throw new Error(`Import style "${style}" not supported.`);
  },
} as const;
