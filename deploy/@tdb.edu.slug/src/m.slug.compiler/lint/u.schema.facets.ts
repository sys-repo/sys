import { Schema } from './common.ts';
import { LintDocFacets } from './common.ts';

export const SchemaFacets = Schema.Type.Optional(
  Schema.Type.Array(
    Schema.Type.Union(LintDocFacets.map((facet) => Schema.Type.Literal(facet))),
    { minItems: 0 },
  ),
);
