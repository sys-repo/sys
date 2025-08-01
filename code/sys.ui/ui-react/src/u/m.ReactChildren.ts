import type { ReactChildrenLib } from './t.ts';

import { useMemo } from 'react';
import { deps } from './m.ReactChildren.deps.ts';

export const ReactChildren: ReactChildrenLib = {
  deps,
  useDeps: (children) => useMemo(() => ReactChildren.deps(children), [children]),
};
