import React from 'react';
import { type t, Color, css, TooSmall, useSizeObserver } from './common.ts';
import { Body } from './ui.Body.tsx';

type P = t.ConceptPlayerProps;

export const ConceptPlayer: React.FC<P> = (props) => {
  const { debug = false } = props;

  const size = useSizeObserver();
  const isReady = size.ready;
  const isTooSmall = size.width < 960 || size.height < 480;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      overflow: 'hidden',
      color: theme.fg,
      opacity: isReady ? 1 : 0,
      transition: `opacity 150ms`,
      display: 'grid',
    }),
  };

  const elTooSmall = isTooSmall && <TooSmall theme={theme.name} />;
  const elBody = !isTooSmall && <Body {...props} theme={'Light'} />;

  return (
    <div ref={size.ref} className={css(styles.base, props.style).class}>
      {elTooSmall || elBody}
      {debug && size.toElement({ Absolute: [4, 6, null, null] })}
    </div>
  );
};
