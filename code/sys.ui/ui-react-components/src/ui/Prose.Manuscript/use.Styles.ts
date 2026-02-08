import React from 'react';
import { type t, D } from './common.ts';
import { initStyles, useWebFonts } from './u.css/mod.ts';

type P = { theme?: t.CommonTheme };

/**
 * Thin react wrapper
 */
export const useScopedStyles = (props: P) => {
  useWebFonts();
  React.useEffect(() => {
    const styles = initStyles(props);
    return () => styles.dispose();
  }, [props.theme]);

  const componentAttr = D.componentAttr;
  return { componentAttr } as const;
};
