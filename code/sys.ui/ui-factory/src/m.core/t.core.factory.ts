import type { t } from './common.ts';

/**
 * Factory registry.
 *
 * NOTE: We model `specs` as a mapped type so that each key K keeps its own
 * per-view Slot union (crucial for typed plans). If you only need Id-level
 * narrowing, you can still instantiate this with a simple Record<Id, ...>.
 */
export type FactoryMap<
  Ids extends t.ViewId,
  // Allow each entry to carry its own Slot union; consumers usually pass a concrete object type here.
  RegEntry extends t.Registration<any, any> = t.Registration<Ids, t.SlotId>,
> = { [K in Ids]: RegEntry & t.Registration<K, any> };

export type Factory<
  Ids extends t.ViewId = t.ViewId,
  RegEntry extends t.Registration<any, any> = t.Registration<Ids, t.SlotId>,
> = {
  readonly specs: FactoryMap<Ids, RegEntry>;
  readonly getView: (id: Ids) => Promise<t.GetViewResult>;
};

/** Utilities over a Factory (type-level only, no runtime). */
export type ViewIds<F extends Factory<any, any>> = keyof F['specs'] & string;
export type SlotIds<F extends Factory<any, any>> =
  F['specs'][keyof F['specs']]['spec'] extends infer S
    ? S extends t.ViewSpec<any, infer Slot>
      ? Slot
      : never
    : never;
export type SpecOf<F extends Factory<any, any>, Id extends ViewIds<F>> = F['specs'][Id]['spec'];

/**
 * Factory type specialized with a concrete Id + Slot union.
 * Ensures each registration carries the correct slot set for that view,
 * giving strong typing when authoring or validating plans.
 */
export type FactoryWithSlots<Id extends string, Slot extends string> = t.Factory<
  Id,
  t.Registration<Id, Slot>
>;

/**
 * The canonical map of registrations keyed by view Id.
 * - Used internally by factories (`specs`).
 * - Preserves full `Registration` shape including `spec.slots`.
 */
export type SpecsMap<Ids extends t.ViewId> = Readonly<{
  [K in Ids]: Readonly<t.Registration<K>>;
}>;
