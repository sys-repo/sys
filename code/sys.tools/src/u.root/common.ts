export type * as t from './common.t.ts';

export { pkg } from '../pkg.ts';
export { Args, c, Cli } from '@sys/cli';

import { TOOL_IDS } from './common.tools.ts';

export const D = {
  TOOLS: TOOL_IDS,
} as const;
