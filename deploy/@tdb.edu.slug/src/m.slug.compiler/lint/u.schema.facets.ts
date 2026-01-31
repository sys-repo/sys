import { Schema } from './common.ts';
import { DocLintFacets } from './common.ts';

export const SchemaFacets = Schema.Type.Optional(
  Schema.Type.Array(
    Schema.Type.Union(DocLintFacets.map((facet) => Schema.Type.Literal(facet))),
    { minItems: 0 },
  ),
);
