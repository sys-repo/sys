import { Schema } from './common.ts';
import { SlugLintFacets } from './common.ts';

export const SchemaFacets = Schema.Type.Optional(
  Schema.Type.Array(
    Schema.Type.Union(SlugLintFacets.map((facet) => Schema.Type.Literal(facet))),
    { minItems: 0 },
  ),
);
