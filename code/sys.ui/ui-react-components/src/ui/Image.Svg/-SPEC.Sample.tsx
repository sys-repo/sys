import React from 'react';

import StaticLarger from '../../-sample/images/sample.larger.svg';
import StaticSmall from '../../-sample/images/sample.small.svg';

import type { DebugImage, DebugImportStyle, DebugSignals } from './-SPEC.Debug.tsx';
import { type t, css, Signal } from './common.ts';
import { Svg } from './mod.ts';

export type SampleProps = { signals: DebugSignals };

/**
 * SAMPLE: render an SVG within a React component.
 */
export const Sample: React.FC<SampleProps> = (props) => {
  const { signals } = props;
  const p = signals.props;
  const input = wrangle.importInput(p.importStyle.value, p.image.value);
  const width = p.width.value;
  const isFill = width === undefined;

  type H = HTMLDivElement;
  const viewbox = wrangle.size(p.image.value);
  // const svg = Svg.useSvg<H>(input, viewbox);
  const svg = Svg.useSvg<H>(input, viewbox, (e) => {
    /**
     * Optional: configuration.
     */
    // e.draw.width(1234)
  });

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
  const styles = {
    base: css({
      position: 'relative',
      overflow: 'hidden',
      lineHeight: 0, // NB: ensure no "baseline" gap below the <MediaPlayer>.
    }),
    svg: css({
      Absolute: isFill ? [0, null, null, 0] : undefined,
      width: isFill ? '100%' : undefined,
      height: isFill ? '100%' : undefined,
    }),
  };

  return (
    <div className={styles.base.class}>
      <div ref={svg.ref} className={styles.svg.class} />
    </div>
  );
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
