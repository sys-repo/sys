// @ts-types="@types/react"
import React from 'react';
import { COLORS, css, type t } from '../common.ts';

export type BarSpinnerProps = { style?: t.CssValue };
type BarLoaderProps = { color?: string; width?: number };
let BarLoader: React.ComponentType<BarLoaderProps> | undefined;

export const BarSpinner: React.FC<BarSpinnerProps> = (props) => {
  React.useEffect(() => {
    /**
     * HACK: Errors when this file is parsed within Deno on the server
     *       (because CJS not ESM (??))
     *       Only import the component when within a browser.
     */
    if (!globalThis.window) return;
    import('react-spinners').then((e) => (BarLoader = e.BarLoader));
  });

  const width = 80;
  const styles = {
    base: css({
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 10,
      opacity: 0.5,
      width,
    }),
  };

  if (!BarLoader) return null;

  return (
    <div className={css(styles.base, props.style).class}>
      <BarLoader color={COLORS.DARK} width={width} />
    </div>
  );
};
