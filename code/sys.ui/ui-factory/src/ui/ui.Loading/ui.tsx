import React from 'react';
import { type t, Color, css, Is, Spinners, Time, D } from './common.ts';

export const Loading: React.FC<t.LoadingProps> = (props) => {
  const { debug = false, fadeInDuration = D.fadeInDuration } = props;
  const isFadeIn = Is.number(fadeInDuration) && fadeInDuration > 0;

  /**
   * Hooks:
   */
  const [ready, setReady] = React.useState(false);

  /**
   * Effects:
   */
  React.useEffect(() => {
    let alive = true;
    (async () => {
      await Time.doubleFrame();
      if (!alive) return;
      setReady(true);
    })();
    return () => void (alive = false);
  }, []);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      userSelect: 'none',
      display: 'grid',
      placeItems: 'center',
    }),
    spinner: css({
      opacity: ready || !isFadeIn ? 1 : 0,
      transition: isFadeIn ? `opacity ${fadeInDuration}ms ease` : undefined,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Spinners.Bar theme={theme.name} style={styles.spinner} />
    </div>
  );
};
