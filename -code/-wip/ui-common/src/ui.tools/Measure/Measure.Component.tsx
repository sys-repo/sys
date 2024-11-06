import { useEffect, useRef } from 'react';
import { css, type t } from '../common.ts';

export type ComponentProps = t.MeasureSizeStyle & {
  content?: React.ReactNode;
  style?: t.CssValue;
  onReady?: (size: t.Size) => void;
};

/**
 * Renders a component off screen and measures the
 * offset size of the result.
 */
export const Component: React.FC<ComponentProps> = (props) => {
  const { fontFamily, fontSize, fontWeight, fontStyle } = props;
  const { lineHeight, letterSpacing, width } = props;
  const baseRef = useRef<HTMLDivElement>(null);

  /**
   * [Lifecycle]
   */
  useEffect(() => {
    const el = baseRef.current;
    const width = el?.offsetWidth ?? -1;
    const height = el?.offsetHeight ?? -1;
    const size = { width, height };
    props.onReady?.(size);
  }, []);

  /**
   * [Render]
   */
  const styles = {
    base: css({ Absolute: [-999999, null, null, -999999] }),
    inner: css({ fontFamily, fontSize, fontWeight, fontStyle, lineHeight, letterSpacing, width }),
  };

  return (
    <div ref={baseRef} {...css(styles.base, props.style)}>
      <div {...styles.inner}>{props.content}</div>
    </div>
  );
};
