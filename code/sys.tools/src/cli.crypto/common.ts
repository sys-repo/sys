import { CryptoTool } from './t.namespace.ts';

/** Type re-exports. */
import * as t from './common.t.ts';
export type { t };

/** Libs: */
export { Schema } from '@sys/schema';
export * from '../common.ts';

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
