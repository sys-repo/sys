import React from 'react';
import { type t, Color, css, LayoutHGrid, TooSmall, useSizeObserver } from './common.ts';

export const ConceptPlayer: React.FC<t.ConceptPlayerProps> = (props) => {
  const { debug = false } = props;
  const size = useSizeObserver();
  const isReady = size.ready;
  const isTooSmall = size.width < 960 && size.height < 480;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      opacity: isReady ? 1 : 0,
      display: 'grid',
    }),
  };

  const elBody = !isTooSmall && <LayoutHGrid column={props.column} debug={debug} />;
  const elTooSmall = isTooSmall && <TooSmall theme={theme.name} />;

  return (
    <div ref={size.ref} className={css(styles.base, props.style).class}>
      {elTooSmall || elBody}
      {debug && size.toElement([4, 6, null, null])}
    </div>
  );
};
