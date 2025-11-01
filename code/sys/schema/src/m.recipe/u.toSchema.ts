import { type t, Type as T } from '../common.ts';

export const toSchema: t.RecipeToSchema = (r) => {
  switch (r.kind) {
    case 'string':
      return T.String({
        pattern: r.pattern,
        minLength: r.minLength,
        maxLength: r.maxLength,
        description: r.description,
        title: r.title,
        format: r.format,
      });
    case 'number':
      return T.Number({
        minimum: r.minimum,
        maximum: r.maximum,
        exclusiveMinimum: r.exclusiveMinimum,
        exclusiveMaximum: r.exclusiveMaximum,
        description: r.description,
        title: r.title,
      });
    case 'boolean':
      return T.Boolean({ description: r.description, title: r.title });
    case 'literal':
      return T.Literal(r.value);
    case 'array':
      return T.Array(toSchema(r.items), { description: r.description, title: r.title });
    case 'object':
      return T.Object(mapValues(r.props, toSchema), {
        additionalProperties: r.additionalProperties ?? false,
        description: r.description,
        title: r.title,
      });
    case 'union':
      return T.Union(r.variants.map(toSchema), { description: r.description, title: r.title });
    case 'optional':
      return T.Optional(toSchema(r.of));
  }
};

function mapValues<A, B>(rec: Record<string, A>, f: (a: A) => B): Record<string, B> {
  const out: Record<string, B> = {};
  for (const k of Object.keys(rec)) out[k] = f(rec[k]!);
  return out;
}
