import React from 'react';
import { type t, Color, css, TooSmall, useSizeObserver } from './common.ts';
import { Body } from './u.Body.tsx';

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

  const elBody = !isTooSmall && <Body {...props} size={size.toObject()} />;

  return (
    <div ref={size.ref} className={css(styles.base, props.style).class}>
      {elTooSmall || elBody}
      {debug && size.toElement([4, 6, null, null])}
    </div>
  );
};
