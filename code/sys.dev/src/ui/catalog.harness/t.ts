/**
 * @module
 * Catalog Types
 */
import type { t } from './common.ts';
import type { HarnessSchema } from './ui/Harness/schema.ts';

/** Component props: */
export type HarnessProps = t.Infer<typeof HarnessSchema>;

/** Catalog Id union. */
export type CatalogId = 'Harness:view';

/** Catalog Slot union. */
export type CatalogSlot = 'left' | 'right';
