import { type t, Fs, JsonFile } from '../common.ts';

export * from '../common.ts';
export { getConfig } from './u.config.get.ts';

/**
 * Constants:
 */
const toolname = `__NAME__`;
export const D = {
  toolname,
  Path: {},
  Config: {
    filename: '-__NAME__.config.json',
    doc: JsonFile.default<t.__NAME__ConfigDoc>({ name: toolname }),
  },
} as const;
