import { type t, Type } from './common.ts';
import { BundleDescriptorSlugTreeFsSchema } from './kind.tree.fs/u.schema.ts';
import { BundleDescriptorSlugTreeMediaSeqSchema } from './kind.tree.media.seq/u.schema.ts';

export const BundleDescriptorItemSchema: t.TSchema = Type.Union([
  BundleDescriptorSlugTreeFsSchema,
  BundleDescriptorSlugTreeMediaSeqSchema,
]);

export const BundleDescriptorRootSchema: t.TSchema = Type.Object(
  { bundles: Type.Array(BundleDescriptorItemSchema) },
  { additionalProperties: false },
);
