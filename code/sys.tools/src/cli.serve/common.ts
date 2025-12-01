import { type t, JsonFile } from '../common.ts';

export { HttpServer } from '@sys/http/server';
export * from '../common.ts';
export { getConfig } from './u.config.get.ts';

/**
 * Constants:
 */
const toolname = `system/serve:tools`;
export const D = {
  toolname,
  Path: {},
  Config: {
    filename: '-serve.config.json',
    doc: JsonFile.default<t.ServeConfigDoc>({ name: toolname }),
  },
} as const;
