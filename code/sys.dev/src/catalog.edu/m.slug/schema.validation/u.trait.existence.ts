import type { t } from '../common.ts';

/**
 * Returns semantic errors for unknown or missing traits.
 */
export function validateTraitExistence(input: t.SlugValidateInput): t.Schema.ValidationError[] {
  const { slug, registry, basePath = [] } = input;
  if (!slug || typeof slug !== 'object') return [];

  const traits = (slug as any).traits;
  if (!Array.isArray(traits)) return [];

  const errors: t.Schema.ValidationError[] = [];

  for (const [i, trait] of traits.entries()) {
    const id = trait?.id;
    if (typeof id !== 'string') continue;

    if (!registry.get(id as t.SlugTraitId)) {
      errors.push({
        kind: 'semantic',
        path: [...(basePath as t.ObjectPath), 'traits', i, 'id'],
        message: `Unknown trait id: "${id}"`,
      });
    }
  }

  return errors;
}
