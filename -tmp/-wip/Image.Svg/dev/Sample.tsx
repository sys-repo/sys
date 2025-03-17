import '../types.declare';

import React, { useEffect } from 'react';

import { Svg } from '..';
import { COLORS, css } from '../../../common';
import Image from '../../../../static/images/sample/svg.sample.svg';

export type SampleProps = { color: 'dark' | 'blue'; width: number };

export const Sample: React.FC<SampleProps> = (props) => {
  const { width } = props;
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const svg = Svg.ref('svg.sample', ref.current as HTMLElement);

    const isDark = props.color === 'dark';
    const color = isDark ? COLORS.DARK : COLORS.BLUE;

    const tick = svg.find('tick');
    const outline = svg.find('border-outline');

    tick?.opacity(isDark ? 1 : 0.2);
    outline?.stroke(color);
  }, [props.color]);

  const styles = { base: css({}) };

  return (
    <div ref={ref} {...css(styles.base)}>
      <Image width={width} />
    </div>
  );
};
