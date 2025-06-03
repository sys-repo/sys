import type { ContentLib } from './t.ts';

import { Factory, factory } from '../m.Factory/mod.ts';
import { Is } from './m.Content.Is.ts';

export const Content: ContentLib = {
  Is,
  Factory,
  factory,
} as const;
