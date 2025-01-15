import { css, useRenderer, type t } from '../common.ts';
import { Wrangle } from './u.ts';

export type PanelBarProps = {
  instance: t.DevInstance;
  edge: 'Header' | 'Footer';
  current?: t.DevRenderPropsEdge;
  style?: t.CssValue;
};

export const PanelEdge: React.FC<PanelBarProps> = (props) => {
  const { instance, current, edge } = props;
  const renderer = current?.renderer;
  const { element } = useRenderer(instance, renderer);

  if (!renderer || !element) return <div />;

  /**
   * Render
   */
  const border = (hasBorder: boolean) => (hasBorder ? Wrangle.borderStyle(current) : undefined);
  const styles = {
    base: css({
      position: 'relative',
      boxSizing: 'border-box',
      Padding: current?.padding,
      borderTop: border(edge === 'Footer'),
      borderBottom: border(edge === 'Header'),
      display: 'grid',
    }),
    body: css({ position: 'relative' }),
  };

  return (
    <div {...css(styles.base, props.style)} data-component={`dev.harness:${edge}`}>
      <div {...styles.body}>{element}</div>
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
