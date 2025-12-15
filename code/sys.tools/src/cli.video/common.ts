import { type t } from './common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const id = 'video' satisfies t.VideoTool.Id;
const name = 'system/video:tools' satisfies t.VideoTool.Name;
export const D = {
  tool: { id, name },
} as const;
