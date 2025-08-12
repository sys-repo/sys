import type { t } from './common.ts';

import { IndexTreeItem } from '../Tree.Index.Item/mod.ts';
import { toList } from './m.IndexTree.u.ts';
import { Is } from './m.Is.ts';
import { Yaml } from './m.Yaml.ts';
import { IndexTree as View } from './ui.tsx';

export const IndexTree: t.IndexTreeLib = {
  View,
  Item: { View: IndexTreeItem },
  Yaml,
  Is,
  toList,
};
