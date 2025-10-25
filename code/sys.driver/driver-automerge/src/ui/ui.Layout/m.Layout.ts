import { type t, defaults } from './common.ts';

import { Dev } from './m.Dev.ts';
import { edgeBorder } from './u.ts';
import { Layout as View } from './ui.tsx';

export const Layout: t.LayoutLib = {
  View,
  defaults,
  edgeBorder,
  Dev,
};
