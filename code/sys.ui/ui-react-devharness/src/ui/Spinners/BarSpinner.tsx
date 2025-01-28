import { useEffect } from 'react';
import { COLORS, css, type t } from '../common.ts';

type BarLoaderProps = { color?: string; width?: number };
type BarLoaderComponent = (prop: BarLoaderProps) => JSX.Element | null;
let BarLoader: BarLoaderComponent | undefined;

export type BarSpinnerProps = {
  style?: t.CssValue;
};

export const BarSpinner: React.FC<BarSpinnerProps> = (props) => {
  useEffect(() => {
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
    <div {...css(styles.base, props.style)}>
      <BarLoader color={COLORS.DARK} width={width} />
    </div>
  );
};
