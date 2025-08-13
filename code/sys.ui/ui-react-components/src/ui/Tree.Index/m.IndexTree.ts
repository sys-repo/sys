import type { t } from './common.ts';

import { IndexTreeItem } from '../Tree.Index.Item/mod.ts';
import { Data } from './m.Data.ts';
import { Is } from './m.Is.ts';
import { Yaml } from './m.Yaml.ts';
import { IndexTree as View } from './ui.tsx';

export const IndexTree = {
  View,
  Item: { View: IndexTreeItem },
  Yaml,
  Is,
  Data,
} as const satisfies t.IndexTreeLib;
