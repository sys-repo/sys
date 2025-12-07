import { type t, JsonFile } from '../common.ts';

/**
 * Libs:
 */
export * from '../common.ts';
export { Http, serveFileWithEtag } from '@sys/http/server';

/**
 * Constants:
 */
const toolname = `system/serve:tools`;
export const D = {
  toolname,
  port: 4040,
  Path: {},
  Config: {
    filename: '-serve.config.json',
    doc: JsonFile.default<t.ServeTool.ConfigDoc>({ name: toolname }),
  },
} as const;

/**
 * Create a CLI prompt menu-item.
 */
type C = t.ServeTool.Command;
export const opt = (name: string, value: C): t.ServeTool.MenuOption => ({ name, value });
