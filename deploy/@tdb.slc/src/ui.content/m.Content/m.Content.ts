import type { t } from './common.ts';
import { Video } from './m.Video.ts';

import { Factory, factory } from '../m.Factory/mod.ts';
import { Is } from './m.Is.ts';

export const Content: t.ContentLib = {
  Is,
  Video,
  Factory,
  factory,
} as const;
