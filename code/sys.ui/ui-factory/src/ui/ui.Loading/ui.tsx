import React from 'react';
import { type t, rx, Time, Color, css, Spinners, Is } from './common.ts';

export const Loading: React.FC<t.LoadingProps> = (props) => {
  const { debug = false, fadeInDuration } = props;
  const hasFadeIn = Is.number(fadeInDuration);

  /**
   * Hooks:
   */
  const [ready, setReady] = React.useState(false);

  /**
   * Effects:
   */
  React.useEffect(() => {
    let disposed = false;
    Time.doubleFrame().then(init);
    async function init() {
      if (disposed) return;
      setReady(true);
    }
    return () => void (disposed = true);
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
      opacity: ready || !hasFadeIn ? 1 : 0,
      transition: hasFadeIn ? `opacity ${fadeInDuration}ms ease` : undefined,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Spinners.Bar theme={theme.name} style={styles.spinner} />
    </div>
  );
};
