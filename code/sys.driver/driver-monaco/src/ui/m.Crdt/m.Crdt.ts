import type { t } from './common.ts';
import { Link } from './m.Link.ts';
import { bind } from './u.bind.ts';
import { useCrdtBinding as useBinding } from './use.CrdtBinding.ts';

/**
 * Tools for binding between a Monaco editor and
 * an immutable CRDT document interface.
 */
export const EditorCrdt: t.EditorCrdtLib = {
  Link,
  bind,
  useBinding,
};
