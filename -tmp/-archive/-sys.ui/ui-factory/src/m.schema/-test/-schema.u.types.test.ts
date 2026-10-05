import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import type { t } from '../common.ts';
import { Type } from '../common.ts';
import { Schema } from '../mod.ts';

describe('ui-factory: Schema.Types', () => {
  describe('Types.fromRegs', () => {
    type Id = 'WithSchema' | 'AlsoWithSchema' | 'NoSchema';
    type Slot = 'Main' | never;

    const regs = [
      {
        spec: {
          id: 'WithSchema',
          slots: [] as const,
          schema: Type.Object({ foo: Type.String() }),
        },
        load: async () => ({}),
      },
      {
        spec: {
          id: 'AlsoWithSchema',
          slots: [] as const,
          schema: Type.Object({ bar: Type.Integer() }),
        },
        load: async () => ({}),
      },
      {
        spec: {
          id: 'NoSchema',
          slots: [] as const,
        },
        load: async () => ({}),
      },
    ] satisfies readonly t.Registration<Id, Slot, unknown>[];

    it('includes only ids with schemas', () => {
      const out = Schema.Types.fromRegs(regs);
      expect(Object.keys(out)).to.include.members(['WithSchema', 'AlsoWithSchema']);
      expect(out['NoSchema']).to.be.undefined;
    });

    it('returns the exact schema object reference', () => {
      const out = Schema.Types.fromRegs(regs);
      const expected = (regs[0].spec as { schema: t.TSchema }).schema;
      expect(out['WithSchema']).to.equal(expected); // identity check
    });

    it('empty registrations → empty map', () => {
      const out = Schema.Types.fromRegs([]);
      expect(out).to.eql({});
    });

    it('map is readonly at the type level (cannot mutate)', () => {
      const out = Schema.Types.fromRegs(regs);

      // Compile-time only: mutation is forbidden
      // @ts-expect-error - readonly contract prevents reassignment
      out['WithSchema'] = undefined;

      // Explicit type-equality check
      expectTypeOf(out).toEqualTypeOf<
        Readonly<Partial<Record<'WithSchema' | 'NoSchema', t.TSchema>>>
      >();
    });
  });
});
