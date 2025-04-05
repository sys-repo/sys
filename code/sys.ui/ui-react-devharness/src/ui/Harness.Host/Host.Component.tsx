import React from 'react';
import { Color, css, useRenderer, type t } from '../common.ts';
import { Wrangle } from './u.ts';

export type HostComponentProps = {
  instance: t.DevInstance;
  border?: string;
  renderProps?: t.DevRenderProps;
  subjectRef?: React.RefObject<HTMLDivElement>;
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
      color: Color.format(component?.color),
      backgroundColor: Color.format(component?.backgroundColor),
      width,
      height,
    }),
  };

  const elBody = element && (
    <div
      ref={props.subjectRef}
      className={styles.body.class}
      data-component={'sys.ui.dev.harness:ComponentHost'}
    >
      {element as t.ReactNode}
    </div>
  );

  return <div className={css(styles.base, props.style).class}>{elBody}</div>;
};
