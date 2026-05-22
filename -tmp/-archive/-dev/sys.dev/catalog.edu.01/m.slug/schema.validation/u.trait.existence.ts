import type { t } from '../common.ts';

type L = t.SlugValidationLib;

/**
 * Returns semantic errors for unknown or missing traits.
 * Uses `traits[].of` and reports at ['traits', i, 'of'].
 */
export const validateTraitExistence: L['validateTraitExistence'] = (input) => {
  const { slug, registry, basePath = [] } = input;
  if (!slug || typeof slug !== 'object') return [];

  const traits = (slug as any).traits;
  if (!Array.isArray(traits)) return [];

  const errors: t.Schema.ValidationError[] = [];

  for (const [i, trait] of traits.entries()) {
    const of = trait?.of;
    if (typeof of !== 'string') continue;

    if (!registry.get(of as t.SlugTraitId)) {
      errors.push({
        kind: 'semantic',
        path: [...(basePath as t.ObjectPath), 'traits', i, 'of'],
        message: `Unknown trait id: "${of}"`,
      });
    }
  }

  return errors;
};
