import React from 'react';
import { type t, Color, css, DEFAULTS } from './common.ts';
import { SvgImage } from './ui.Svg.tsx';

type P = t.CanvasMiniProps;

/**
 * Component.
 */
export const CanvasMini: React.FC<P> = (props) => {
  const { selected, over, onPanelEvent, width } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      userSelect: 'none',
      cursor: 'default',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <SvgImage
        theme={theme.name}
        width={width}
        selected={selected}
        over={over}
        onPanelEvent={onPanelEvent}
      />
    </div>
  );
};
