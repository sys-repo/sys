/**
 * @module
 * Content library
 */
import type { t } from './common.ts';

import { Factory, factory } from '../m.Factory/mod.ts';
import { Is } from './m.Is.ts';

export const Content: t.ContentLib = {
  Is,
  Factory,
  factory,
} as const;
