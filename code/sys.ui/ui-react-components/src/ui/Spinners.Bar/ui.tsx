import React, { useEffect } from 'react';
import { type t, Color, css, D } from './common.ts';

type BarLoaderProps = { color?: string; width?: number };
let BarLoader: React.ComponentType<BarLoaderProps> | undefined;

export const BarSpinner: React.FC<t.BarSpinnerProps> = (props) => {
  const { width = D.width } = props;

  /**
   * Effect:
   */
  useEffect(() => {
    /**
     * HACK: Errors when this file is parsed within Deno on the server
     *       (because CJS not ESM (??))
     *       Only import the component when within a browser.
     */
    if (!globalThis.window) return;
    import('react-spinners').then((e) => (BarLoader = e.BarLoader));
  }, []);

  if (!BarLoader) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 10,
      opacity: 0.5,
      width,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <BarLoader color={theme.fg} width={width} />
    </div>
  );
};
