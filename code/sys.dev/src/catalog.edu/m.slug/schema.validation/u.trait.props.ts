import { type t, Is, Obj, Value } from '../common.ts';
import { indexAliases, readTraits } from './u.trait.alias.ts';

/**
 * Validates alias–props consistency:
 * - duplicate aliases
 * - missing props for declared aliases
 * - orphan props without matching traits
 */
export function validateAliasRules(input: t.SlugValidateInput): t.Schema.ValidationError[] {
  const { slug, basePath = [] } = input;
  const { traits, props } = readTraits(slug);
  if (!traits.length) return [];

  const { byAlias } = indexAliases(traits);
  const errors: t.Schema.ValidationError[] = [];
  const pushError = (path: t.ObjectPath, message: string) => {
    errors.push({ kind: 'semantic', path: [...basePath, ...path], message });
  };

  // 1. Duplicate alias:
  for (const [as, idxs] of byAlias) {
    if (idxs.length > 1) {
      // Mark all duplicates after the first
      idxs.slice(1).forEach((i) => {
        pushError(['traits', i, 'as'], `Duplicate trait alias: "${as}"`);
      });
    }
  }

  // If no {props} object, still report missing for any alias binds:
  if (!props) {
    for (const as of byAlias.keys()) {
      pushError(['props'], `Missing props for alias: "${as}"`);
    }
    return errors;
  }

  // 2. Missing props for alias:
  for (const as of byAlias.keys()) {
    if (!(as in props)) {
      pushError(['props'], `Missing props for alias: "${as}"`);
    }
  }

  // 3. Orphan props keys:
  for (const key of Object.keys(props)) {
    if (!byAlias.has(key)) {
      pushError(['props', key], `Orphan props: "${key}" (no matching trait alias)`);
    }
  }

  return errors;
}

/**
 * Validates prop object shapes against each trait’s schema
 * using the registered definitions.
 */
export function validatePropsShape(input: t.SlugValidateInput): t.Schema.ValidationError[] {
  const { slug, registry, basePath = [] } = input;
  const { traits, props } = readTraits(slug);
  if (!traits.length || !props) return [];

  const errors: t.Schema.ValidationError[] = [];

  // Build alias → trait id map (only valid string ids):
  const aliasToTrait = new Map<string, string>();
  for (const tr of traits) {
    const as = tr?.as;
    const id = tr?.id;
    if (Is.string(as) && Is.string(id)) aliasToTrait.set(as, id);
  }

  for (const [as, value] of Object.entries(props)) {
    const traitId = aliasToTrait.get(as);
    if (!traitId) continue; // orphan handled in validateAliasRules

    const entry = registry.get(traitId as t.SlugTraitId);
    if (!entry) continue; // unknown trait handled in existence validator.

    // Validate shape:
    const iterator = Value.Errors(entry.propsSchema, value);
    for (const e of iterator) {
      // Normalize TypeBox's JSON Pointer (string) or array path → [ObjectPath]:
      const segs = Obj.Path.normalize((e as any).path, { numeric: true });
      const base = basePath ?? [];
      const path: t.ObjectPath = [...base, 'props', as, ...segs];
      errors.push({ kind: 'semantic', path, message: e.message });
    }
  }

  return errors;
}
