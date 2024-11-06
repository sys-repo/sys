import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View } from './ui.tsx';

import type { t } from './common.ts';

type R = t.CmdBarRef;
type P = t.CmdBarStatefulProps;

/**
 * Stateful <CmdBar>
 */
export const CmdBarStateful: React.FC<P> = forwardRef<R, P>((props: P, ref: R) => {
  const [count, setCount] = useState(0);
  const innerRef = useRef<t.CmdBarRef | undefined>(undefined);

  useImperativeHandle(ref, () => innerRef.current as t.CmdBarRef, [count]);

  return (
    <View
      {...props}
      onReady={(e) => {
        innerRef.current = e.cmdbar;
        setCount((n: number) => n + 1);
        props.onReady?.(e);
      }}
    />
  );
});
