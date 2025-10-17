import { type t } from '../common.ts';

type Regs = readonly t.ReactRegistration<t.CatalogId, t.CatalogSlot>[];

/**
 * Minimal registrations:
 */
export const regs: Regs = [];
