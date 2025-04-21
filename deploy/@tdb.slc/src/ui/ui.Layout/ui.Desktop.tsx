import React from 'react';
import { type t, App, Cropmarks, css, Signal, TooSmall, useSizeObserver } from './common.ts';

type P = t.LayoutDesktopProps;

/**
 * Component:
 */
export const LayoutDesktop: React.FC<P> = (props) => {
  const { state } = props;
  const p = state?.props;
  if (!p) return null;

  const size = useSizeObserver();
  const isReady = size.ready;
  let isTooSmall = wrangle.tooSmall(size.rect);

  /**
   * Effects:
   */
  Signal.useRedrawEffect(() => state.listen());

  /**
   * Render:
   */
  const styles = {
    base: css({
      opacity: isReady ? 1 : 0,
      position: 'relative',
      display: 'grid',
    }),
    bg: css({ Absolute: 0, display: 'grid' }),
    body: css({ Absolute: 0, display: 'grid' }),
    stack: css({ Absolute: 0, display: 'grid', pointerEvents: 'none' }),
    cropmarks: {
      base: css({ Absolute: 0, display: 'grid', pointerEvents: 'none' }),
      body: css({ width: 390, pointerEvents: 'auto' }),
    },
  };

  const elCropmarks = (
    <div className={styles.cropmarks.base.class}>
      <Cropmarks
        theme={'Dark'}
        borderOpacity={0.05}
        size={{ mode: 'fill', x: false, y: true, margin: [0, 40, 0, 40] }}
      >
        <div className={styles.cropmarks.body.class}></div>
      </Cropmarks>
    </div>
  );

  const elStackItems = App.Render.stack(state);
  const elStack = <div className={styles.stack.class}>{elStackItems}</div>;

  const elBody = (
    <React.Fragment>
      <div className={styles.bg.class} />
      <div className={styles.body.class}>
        {elCropmarks}
        {elStack}
      </div>
    </React.Fragment>
  );

  const elTooSmall = <TooSmall theme={props.theme} />;

  return (
    <div ref={size.ref} className={css(styles.base, props.style).class}>
      {isTooSmall ? elTooSmall : elBody}
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  tooSmall(size?: t.DomRect) {
    if (!size) return null;
    if (size.height < 520) return true;
    if (size.width < 630) return true;
    return false;
  },
} as const;
