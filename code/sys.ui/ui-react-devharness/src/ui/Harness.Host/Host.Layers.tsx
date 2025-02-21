// @ts-types="@types/react"
import React from 'react';
import { css, type t } from '../common.ts';
import { HostLayer } from './Host.Layer.tsx';

export type HostLayersProps = {
  instance: t.DevInstance;
  layers: t.DevRenderPropsLayer[];
  style?: t.CssValue;
};

export const HostLayers: React.FC<HostLayersProps> = (props) => {
  const { instance, layers } = props;
  if (layers.length === 0) return null;

  /**
   * [Render]
   */
  const styles = {
    base: css({
      Absolute: 0,
      pointerEvents: 'none',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {layers.map((layer) => {
        return <HostLayer key={layer.index} instance={instance} layer={layer} />;
      })}
    </div>
  );
};
