import { useMemo } from 'react';
import type { t } from './common.ts';
import { deps } from './m.ReactChildren.deps.ts';

export const ReactChildren: t.ReactChildrenLib = {
  deps,
  useDeps: (children) => useMemo(() => ReactChildren.deps(children), [children]),
};
