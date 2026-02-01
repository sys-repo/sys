import type { t } from './common.ts';
import { Type } from './common.ts';
import { BundleDescriptorBaseFields } from '../u.schema.core.ts';

const Dir = Type.String({ description: 'Directory name relative to base path.' });
const Path = Type.String({ description: 'Relative file path.' });

const LayoutFs = Type.Object(
  {
    manifestsDir: Type.Optional(Dir),
    contentDir: Type.Optional(Dir),
  },
  { additionalProperties: false },
);

const FsFiles = Type.Object(
  {
    tree: Type.Optional(Path),
    index: Type.Optional(Path),
  },
  { additionalProperties: false },
);

export const BundleDescriptorSlugTreeFsSchema: t.TSchema = Type.Object(
  {
    ...BundleDescriptorBaseFields,
    kind: Type.Literal('slug-tree:fs'),
    layout: Type.Optional(LayoutFs),
    files: Type.Optional(FsFiles),
  },
  { additionalProperties: false },
);

export { LayoutFs, FsFiles };
