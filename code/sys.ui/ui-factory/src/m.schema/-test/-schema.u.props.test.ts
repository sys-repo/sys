import { Type, describe, expect, it, type t } from '../../-test.ts';
import { Schema } from '../mod.ts';

describe('ui-factory: schema props helpers', () => {
  type Id = 'A:view' | 'B:view' | 'C:view';
  type Slot = 'Main' | 'Side' | never;

  const regs = [
    {
      spec: {
        id: 'A:view',
        slots: [] as const,
        schema: Type.Object({ title: Type.String(), count: Type.Optional(Type.Integer()) }),
      },
      load: async () => ({}),
    },
    {
      spec: {
        id: 'B:view',
        slots: [] as const,
        schema: Type.Object({ enabled: Type.Boolean() }),
      },
      load: async () => ({}),
    },
    {
      spec: {
        id: 'C:view',
        slots: [] as const,
        // No schema.
      },
      load: async () => ({}),
    },
  ] satisfies readonly t.Registration<Id, Slot, unknown>[];

  describe('makePropsValidators', () => {
    it('creates validators only for ids with schema', () => {
      const validators = Schema.Props.makeValidators(regs);
      expect(Object.keys(validators)).to.include.members(['A:view', 'B:view']);
      expect(validators['A:view']).to.exist;
      expect(validators['B:view']).to.exist;
      expect(validators['C:view']).to.be.undefined;
    });
  });

  describe('validateProps', () => {
    const validators = Schema.Props.makeValidators(regs);

    it('ok:true when props conform to schema', () => {
      const okA = Schema.Props.validate('A:view', { title: 'Hello', count: 3 }, validators);
      const okB = Schema.Props.validate('B:view', { enabled: false }, validators);
      expect(okA).to.eql({ ok: true });
      expect(okB).to.eql({ ok: true });
    });

    it('ok:false with normalized errors when invalid', () => {
      // Assert the validator exists so test failures are crisp:
      expect(validators['A:view']).to.exist;

      const bad = Schema.Props.validate('A:view', { title: 123 }, validators);
      expect(bad.ok).to.eql(false);
      if (!bad.ok) {
        expect(bad.errors).to.be.an('array').and.have.length.greaterThan(0);
        expect(bad.errors?.[0].path).to.eql(['title']);
        expect(bad.errors?.[0].message).to.match(/Expected string/i);
      }
    });

    it('ids without a schema are treated as valid (by design)', () => {
      const noSchema = Schema.Props.validate('C:view', { anything: 'goes' }, validators);
      expect(noSchema).to.eql({ ok: true });
    });

    it('empty validator map → ok:true', () => {
      const ok = Schema.Props.validate('A:view', { title: 42 }, {} as t.PropsValidators<Id>);
      expect(ok).to.eql({ ok: true });
    });
  });
});
