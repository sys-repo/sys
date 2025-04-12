import React from 'react';
import { type t, css } from './common.ts';
import { SvgImage } from './ui.Svg.tsx';
import { useSelection } from './use.Selection.ts';

type P = t.LogoCanvasProps;

/**
 * Component.
 */
export const LogoCanvas: React.FC<P> = (props) => {
  const { over, onPanelEvent, width } = props;
  const { selected } = useSelection(props);

  /**
   * Render:
   */
  const styles = {
    base: css({
      position: 'relative',
      cursor: 'default',
      userSelect: 'none',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <SvgImage
        theme={props.theme}
        width={width}
        selected={selected}
        over={over}
        onPanelEvent={onPanelEvent}
      />
    </div>
  );
};
