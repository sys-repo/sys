import { expect } from '@sys/testing/server';
import { type t } from './common.ts';

/**
 * Ensure the factory preserves the given slots for a given id.
 */
export const expectSlots = <I extends string, S extends string>(
  f: t.FactoryWithSlots<I, S>,
  id: I,
  slots: readonly S[],
) => expect((f.specs[id] as any).spec.slots).to.eql(slots);
