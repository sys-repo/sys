import { VideoTool } from './t.namespace.ts';

import { type t } from './common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
export const id = VideoTool.ID;
export const name = VideoTool.NAME;
export const D = {
  tool: { id, name },
} as const;
