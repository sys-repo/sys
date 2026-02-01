import type { t } from './common.ts';
import { Type } from './common.ts';
import { BundleDescriptorSlugTreeFsSchema } from './kind.tree.fs/u.schema.ts';
import { BundleDescriptorSlugTreeMediaSeqSchema } from './kind.tree.media.seq/u.schema.ts';

export const BundleDescriptorSchema: t.TSchema = Type.Union([
  BundleDescriptorSlugTreeFsSchema,
  BundleDescriptorSlugTreeMediaSeqSchema,
]);

export const BundleDescriptorDocSchema: t.TSchema = Type.Object(
  { bundles: Type.Array(BundleDescriptorSchema) },
  { additionalProperties: false },
);
