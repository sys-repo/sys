import type { t } from './common.ts';
import { TOOL_IDS } from './common.tools.ts';

export * from '../common.ts';

/**
 * Root tool commands (canonical).
 */
export const D = {
  TOOLS: TOOL_IDS satisfies readonly t.Tools.Command[],
} as const;
