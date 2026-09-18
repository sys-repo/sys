import React from 'react';
import { type t, D, useFontBundle, ETBook } from './common.ts';
import { initStyles } from './u.styles/mod.ts';

type P = { theme?: t.CommonTheme };

/**
 * Thin react wrapper
 */
export const useScopedStyles = (props: P) => {
  useFontBundle(ETBook);

  React.useEffect(() => {
    const { dispose } = initStyles(props);
    return dispose;
  }, [props.theme]);

  const componentAttr = D.componentAttr;
  return { componentAttr } as const;
};
