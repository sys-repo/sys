import { defaults, type t } from './common.ts';

import { edgeBorder } from './u.ts';
import { Layout as View } from './ui.tsx';

/** Layout view helpers for Automerge UI shells. */
export const Layout: t.Layout.Lib = {
  View,
  defaults,
  edgeBorder,
};
