import React from 'react';
import { css, useRenderer, type t } from '../common.ts';

export type HostLayerProps = {
  instance: t.DevInstance;
  layer: t.DevRenderPropsLayer;
  style?: t.CssInput;
};

export const HostLayer: React.FC<HostLayerProps> = (props) => {
  const { instance, layer } = props;
  const renderer = layer.renderer;
  const { element } = useRenderer(instance, renderer);
  if (!element) return null;

  /**
   * [Render]
   */
  const styles = {
    base: css({
      Absolute: 0,
      display: 'grid',
      pointerEvents: 'none',
    }),
  };

  return <div className={css(styles.base, props.style).class}>{element as t.ReactNode}</div>;
};
