import { type t, Is, Obj, Value } from '../common.ts';
import { indexAliases, readTraits } from './u.trait.alias.ts';

type L = t.SlugValidationLib;

/**
 * Validates alias–data consistency:
 * - duplicate aliases
 * - missing data for declared aliases
 * - orphan data without matching traits
 *
 * Note: emits RELATIVE paths; range attachment applies basePath upstream.
 */
export const validateAliasRules: L['validateAliasRules'] = (input) => {
  const { slug, basePath = [] } = input;
  const { traits, data } = readTraits(slug);
  if (!traits.length) return [];

  const { byAlias } = indexAliases(traits);
  const errors: t.Schema.ValidationError[] = [];
  const pushError = (path: t.ObjectPath, message: string) => {
    errors.push({ kind: 'semantic', path: [...basePath, ...path], message });
  };

  // 1) Duplicate alias:
  for (const [as, idxs] of byAlias) {
    if (idxs.length > 1) {
      // Mark duplicates after the first occurrence.
      for (const i of idxs.slice(1)) {
        pushError(['traits', i, 'as'], `Duplicate trait alias: "${as}"`);
      }
    }
  }

  // If no {data} object, still report missing for any alias binds:
  if (!data) {
    for (const as of byAlias.keys()) {
      pushError(['data'], `Missing data for alias: "${as}"`);
    }
    return errors;
  }

  // 2) Missing data for alias:
  for (const as of byAlias.keys()) {
    if (!(as in data)) {
      pushError(['data'], `Missing data for alias: "${as}"`);
    }
  }

  // 3) Orphan data keys:
  for (const key of Object.keys(data)) {
    if (!byAlias.has(key)) {
      pushError(['data', key], `Orphan data: "${key}" (no matching trait alias)`);
    }
  }

  return errors;
};

/**
 * Validates per-alias instance data shape against each trait’s schema.
 * - Looks up trait by `traits[].of`
 * - Validates the value at `data[alias]`
 * - Emits paths under: ['data', alias, ...schemaPath]
 */
export function validatePropsShape(input: t.SlugValidateInput): t.Schema.ValidationError[] {
  const { slug, registry, basePath = [] } = input;
  const { traits, data } = readTraits(slug);
  if (!traits.length || !data) return [];

  const errors: t.Schema.ValidationError[] = [];

  // Build alias → trait-id map from traits[].{as,of}
  const aliasToTrait = new Map<string, string>();
  for (const tr of traits as Array<{ as?: unknown; of?: unknown }>) {
    const as = tr?.as;
    const of = tr?.of;
    if (Is.string(as) && Is.string(of)) aliasToTrait.set(as, of);
  }

  // Validate each present data bucket against its trait's schema.
  for (const [as, value] of Object.entries(data)) {
    const traitId = aliasToTrait.get(as);
    if (!traitId) continue; // orphan handled in validateAliasRules

    const entry = registry.get(traitId as t.SlugTraitId);
    if (!entry) continue; // unknown trait handled in existence validator

    // TypeBox validator yields iterator of errors with pointer paths.
    for (const e of Value.Errors(entry.propsSchema, value)) {
      const segs = Obj.Path.normalize((e as { path?: unknown }).path, { numeric: true });
      const path: t.ObjectPath = [...basePath, 'data', as, ...segs];
      errors.push({ kind: 'semantic', path, message: e.message });
    }
  }

  return errors;
}
