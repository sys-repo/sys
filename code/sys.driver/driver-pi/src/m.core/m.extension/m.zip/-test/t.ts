import type { ToolDefinition } from '@earendil-works/pi-coding-agent';

export type * from '../source/t.ts';

/** Only the registered tool surface exercised by direct runtime tests. */
export type Tool = Pick<ToolDefinition, 'name' | 'executionMode' | 'execute'>;
