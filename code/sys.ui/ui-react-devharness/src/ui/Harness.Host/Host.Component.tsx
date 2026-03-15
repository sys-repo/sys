import React from 'react';
import { Color, css, Is, pkg, useRenderer, type t } from '../common.ts';
import { Wrangle } from './u.ts';

export type HostComponentProps = {
  instance: t.DevInstance;
  border?: string;
  renderProps?: t.DevRenderProps;
  subjectRef?: React.RefObject<HTMLDivElement | null>;
  style?: t.CssInput;
};

export const HostComponent: React.FC<HostComponentProps> = (props) => {
  const { instance, border } = props;
  const component = props.renderProps?.subject;
  const renderer = component?.renderer;
  const { element } = useRenderer(instance, renderer);

  /**
   * [Render]
   */
  const { width, height } = Wrangle.componentSize(component?.size);
  const styles = {
    base: css({
      position: 'relative',
      display: 'grid',
      border,
    }),
    body: css({
      position: 'relative',
      display: component?.display,
      color: wrangle.color(component?.color),
      backgroundColor: wrangle.color(component?.backgroundColor),
      width,
      height,
    }),
  };

  const elBody = element && (
    <div
      ref={props.subjectRef}
      className={styles.body.class}
      data-component={`${pkg.name}:ComponentHost`}
    >
      {element as t.ReactNode}
    </div>
  );

  return <div className={css(styles.base, props.style).class}>{elBody}</div>;
};

const wrangle = {
  color(value?: string | number) {
    if (value === undefined) return undefined;
    return Is.str(value) ? value : Color.toGrayAlpha(value);
  },
} as const;
