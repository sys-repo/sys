// @ts-types="@types/react"
import React from 'react';
import { css, useRenderer, type t } from '../common.ts';

export type DebugPanelBodyRow = {
  instance: t.DevInstance;
  renderer: t.DevRendererRef;
};

export const DebugPanelBodyRow: React.FC<DebugPanelBodyRow> = (props) => {
  const { instance, renderer } = props;
  const { element } = useRenderer(instance, renderer);

  const styles = {
    base: css({
      position: 'relative',
      display: 'grid',
      lineHeight: 1.6,
    }),
  };

  return <div className={styles.base.class}>{element as t.ReactNode}</div>;
};
