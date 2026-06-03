import { type t } from './common.ts';

import { useMemo } from 'react';
import { deps } from './m.ReactChildren.deps.ts';

export const ReactChildren: t.ReactChildren.Lib = {
  deps,
  useDeps: (children) => useMemo(() => ReactChildren.deps(children), [children]),
};
