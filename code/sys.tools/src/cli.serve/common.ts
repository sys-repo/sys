import { type t, JsonFile } from '../common.ts';

/**
 * Libs:
 */
export * from '../common.ts';
export { getConfig } from './u.config.get.ts';

export { Http } from '@sys/http/server';

/**
 * Constants:
 */
const toolname = `system/serve:tools`;
export const D = {
  toolname,
  Path: {},
  Config: {
    filename: '-serve.config.json',
    doc: JsonFile.default<t.ServeTool.ConfigDoc>({ name: toolname }),
  },
} as const;
