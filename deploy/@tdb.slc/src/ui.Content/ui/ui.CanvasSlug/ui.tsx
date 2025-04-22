import React, { useState } from 'react';
import {
  type t,
  Color,
  css,
  FadeText,
  LogoCanvas,
  LogoWordmark,
  Time,
  TooSmall,
  useSizeObserver,
} from './common.ts';

export const CanvasSlug: React.FC<t.CanvasSlugProps> = (props) => {
  const { debug = false, logo } = props;
  const size = useSizeObserver();

  const [ready, setReady] = useState(false);

  /**
   * Effect:
   */
  React.useEffect(() => {
    const time = Time.until();
    time.delay(500, () => setReady(true));
    return time.dispose;
  }, [size.ready]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      display: 'grid',
      opacity: ready ? 1 : 0,
      transition: '1200ms',
    }),
    body: css({ position: 'relative', display: 'grid', placeItems: 'center' }),
    layout: css({ display: 'grid', placeItems: 'center', rowGap: '30px' }),
    canvas: css({ position: 'relative', width: 280 }),
    logo: css({ width: logo === 'SLC' ? 130 : 200 }),
    footer: css({
      position: 'relative',
      height: 115,
      width: '100%',
      display: 'grid',
      placeItems: 'center',
    }),
    text: css({ Absolute: 0 }),
  };

  const elText = <FadeText text={logo ? '' : props.text} style={styles.text} />;
  const elWordmark = logo && <LogoWordmark theme={theme.name} logo={logo} style={styles.logo} />;
  const elFooter = (
    <div className={styles.footer.class}>
      {elText}
      {elWordmark}
    </div>
  );

  const elBody = (
    <div className={styles.body.class}>
      <div className={styles.layout.class}>
        <LogoCanvas theme={theme.name} style={styles.canvas} selected={props.selected} />
        {elFooter}
      </div>
    </div>
  );

  const elTooSmall = size.ready && size.height < 320 && <TooSmall />;

  return (
    <div ref={size.ref} className={css(styles.base, props.style).class}>
      {elTooSmall || elBody}
      {debug && size.toElement({ Absolute: [6, 8, null, null], opacity: 0.3 })}
    </div>
  );
};
