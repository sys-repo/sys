import { Type } from './common.ts';

const Version = Type.Number({ description: 'Bundle descriptor schema version.' });
const Docid = Type.String({ description: 'Bundle document id for manifest.' });
const BasePath = Type.String({ description: 'Optional base path for bundle.' });

export const BundleDescriptorBaseFields = {
  version: Version,
  docid: Docid,
  basePath: Type.Optional(BasePath),
} as const;
