import { type t } from './common.ts';

import { useMemo } from 'react';
import { deps } from './m.ReactChildren.deps.ts';

/** React children dependency helpers for memo and effect inputs. */
export const ReactChildren: t.ReactChildren.Lib = {
  deps,
  useDeps: (children) => useMemo(() => ReactChildren.deps(children), [children]),
};
