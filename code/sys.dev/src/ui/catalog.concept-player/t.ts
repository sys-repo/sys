/**
 * @module
 * Catalog Types
 */
import type { t } from './common.ts';
import type { HelloSchema } from './ui/Hello/schema.ts';
import type { LayoutSchema } from './ui/Layout/schema.ts';

/** Component props: */
export type HelloProps = t.Infer<typeof HelloSchema>;
export type LayoutProps = t.Infer<typeof LayoutSchema>;

/** Catalog Id union */
export type CatalogId = 'Hello:view' | 'Layout:view';

/** Catalog Slot union */
export type CatalogSlot = never;
