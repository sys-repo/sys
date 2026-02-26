import { CryptoTool } from './t.namespace.ts';
import { type t } from '../common.ts';

export * from '../common.ts';
export { Schema } from '@sys/schema';

/**
 * Constants:
 */
const id = CryptoTool.ID;
const name = CryptoTool.NAME;
export const D = {
  tool: { id, name },
  Path: {},
} as const;

/**
 * Create a CLI prompt menu-item.
 */
type C = t.CryptoTool.MenuCmd;
export const opt = (name: string, value: C): t.CryptoTool.MenuOption => ({ name, value });
