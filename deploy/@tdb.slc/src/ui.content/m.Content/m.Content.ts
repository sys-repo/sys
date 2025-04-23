import type { t } from './common.ts';

import { Factory, factory } from '../m.Factory/mod.ts';
import { Is } from './m.Content.Is.ts';
import { Video } from './m.Content.Video.ts';

export const Content: t.ContentLib = {
  Is,
  Video,
  Factory,
  factory,
} as const;
