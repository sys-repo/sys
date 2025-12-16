import { type t, JsonFile } from '../common.ts';

/**
 * Libs:
 */
export * from '../common.ts';
export { Http, serveFileWithEtag } from '@sys/http/server';

/**
 * Constants:
 */
const id = 'serve' satisfies t.ServeTool.Id;
const name = 'system/serve:tools' satisfies t.ServeTool.Name;
export const D = {
  tool: { id, name },
  port: 4040,
  Path: {},
  Config: {
    filename: '-serve.config.json',
    doc: JsonFile.default<t.ServeTool.Config.Doc>({ name }),
  },
} as const;

/**
 * Create a CLI prompt menu-item.
 */
type C = t.ServeTool.Command;
export const opt = (name: string, value: C): t.ServeTool.MenuOption => ({ name, value });
