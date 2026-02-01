/**
 * @module
 * Bundle descriptor schema definitions.
 */
import { type t } from './common.ts';
import {
  BundleDescriptorItemSchema as ItemSchema,
  BundleDescriptorRootSchema as Schema,
} from './u.schema.ts';

export { BundleDescriptorSlugTreeFsSchema } from './kind.tree.fs/u.schema.ts';
export { BundleDescriptorSlugTreeMediaSeqSchema } from './kind.tree.media.seq/u.schema.ts';

export const BundleDescriptorSchema: t.BundleDescriptorSchemaLib = {
  Schema,
  ItemSchema,
};
