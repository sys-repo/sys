import React from 'react';
import { css, type t, useRenderer } from '../common.ts';
import { Wrangle } from './u.ts';

export type PanelBarProps = {
  instance: t.DevInstance;
  edge: 'Header' | 'Footer';
  current?: t.DevRenderPropsEdge;
  defaultBorderColor?: t.DevRenderPropsEdge['border']['color'];
  style?: t.CssInput;
};

export const PanelEdge: React.FC<PanelBarProps> = (props) => {
  const { instance, current, edge } = props;
  const renderer = current?.renderer;
  const { element } = useRenderer(instance, renderer);

  if (!renderer || !element) return <div />;

  /**
   * Render:
   */
  const border = Wrangle.borderStyle(current, props.defaultBorderColor);
  const styles = {
    base: css({
      position: 'relative',
      boxSizing: 'border-box',
      Padding: current?.padding,
      borderTop: edge === 'Footer' ? border : undefined,
      borderBottom: edge === 'Header' ? border : undefined,
      display: 'grid',
    }),
    body: css({ position: 'relative' }),
  };

  return (
    <div className={css(styles.base, props.style).class} data-component={`dev.harness:${edge}`}>
      <div className={styles.body.class}>{element as t.ReactNode}</div>
    </div>
  );
};

/**
 * Header
 */
export type PanelHeaderProps = Omit<PanelBarProps, 'edge'>;
export const PanelHeader: React.FC<PanelHeaderProps> = (props) => {
  return <PanelEdge {...props} edge={'Header'} />;
};

/**
 * Footer
 */
export type PanelFooterProps = Omit<PanelBarProps, 'edge'>;
export const PanelFooter: React.FC<PanelFooterProps> = (props) => {
  return <PanelEdge {...props} edge={'Footer'} />;
};
