import { type t, describe, expect, it } from '../../-test.ts';

import { Schema as BaseSchema } from '@sys/schema';
import { Schema as FactorySchema } from '../mod.ts';

describe('Schema: StandardSchema implementation', () => {
  describe('Props', () => {
    it('creates per-prop validators from registrations and validates wrong/right types', () => {
      // Build base schemas.
      const countSchema = BaseSchema.Type.Number();
      const titleSchema = BaseSchema.Type.String();

      // Minimal sample registrations for ui-factory:
      const regs = [
        {
          spec: { id: 'count', schema: countSchema },
          load: async () => ({ default: () => null }),
        },
        {
          spec: { id: 'title', schema: titleSchema },
          load: async () => ({ default: () => null }),
        },
      ] satisfies readonly t.Registration<string, string, unknown>[];

      const validators = FactorySchema.Props.makeValidators(regs);

      // Each entry is possibly undefined; assert presence before use.
      expect(validators).to.have.property('count');
      expect(validators).to.have.property('title');

      const vCount = validators.count!;
      const vTitle = validators.title!;

      // Wrong type → fail:
      const failCount = vCount.validate('oops');
      expect(failCount.ok).to.equal(false);
      if (!failCount.ok) {
        expect(failCount.errors).to.be.an('array').that.is.not.empty;
        expect(failCount.errors[0]).to.have.property('message');
      }

      // Correct type → pass:
      const okTitle = vTitle.validate('Hello');
      expect(okTitle.ok).to.equal(true);
    });

    it('independently validates each registered prop (no cross-coupling)', () => {
      const activeSchema = BaseSchema.Type.Boolean();
      const nameSchema = BaseSchema.Type.String();

      const regs = [
        {
          spec: { id: 'active', schema: activeSchema },
          load: async () => ({ default: () => null }),
        },
        {
          spec: { id: 'name', schema: nameSchema },
          load: async () => ({ default: () => null }),
        },
      ] satisfies readonly t.Registration<string, string, unknown>[];

      const v = FactorySchema.Props.makeValidators(regs);
      const vActive = v.active!;
      const vName = v.name!;

      expect(vActive.validate(true).ok).to.equal(true);

      const activeFail = vActive.validate(123 as unknown);
      expect(activeFail.ok).to.equal(false);

      expect(vName.validate('Alice').ok).to.equal(true);

      const nameFail = vName.validate({} as unknown);
      expect(nameFail.ok).to.equal(false);
    });

    it('uses the StandardSchema result shape ({ ok, errors }) from upstream', () => {
      const idSchema = BaseSchema.Type.Number();
      const regs = [
        {
          spec: { id: 'id', schema: idSchema },
          load: async () => ({ default: () => null }),
        },
      ] satisfies readonly t.Registration<string, string, unknown>[];

      const validators = FactorySchema.Props.makeValidators(regs);
      const vId = validators.id!;

      const fail = vId.validate('not-a-number');
      expect(fail.ok).to.equal(false);
      if (!fail.ok) {
        expect(fail.errors).to.be.an('array');
        const e0 = fail.errors[0];
        expect(e0).to.have.property('message');
        expect(e0).to.have.any.keys('path', 'instancePath', 'schemaPath'); // ← Be flexible on path format across adapters:
      }

      const pass = vId.validate(42);
      expect(pass.ok).to.equal(true);
    });
  });
});
