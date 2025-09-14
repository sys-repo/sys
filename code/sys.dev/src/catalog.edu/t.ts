/**
 * @module
 * Catalog Types
 */
import type { t } from './common.ts';
import type { HelloSchema } from './ui/Hello/schema.ts';

/** Component props: */
export type HelloProps = t.Infer<typeof HelloSchema>;

/** Catalog Id union. */
export type CatalogId = 'Hello:view';

/** Catalog Slot union. */
export type CatalogSlot = never;
