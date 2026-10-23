import { Type, describe, expect, it } from '../../-test.ts';
import { Schema } from '../mod.ts';

describe('ui-factory: Schema', () => {
  describe('Schema.makeValidator', () => {
    const SampleSchema = Type.Object({
      foo: Type.String(),
      bar: Type.Optional(Type.Number()),
    });

    const validator = Schema.makeValidator(SampleSchema);

    describe('check():', () => {
      it('returns true for valid values', () => {
        expect(validator.check({ foo: 'hello', bar: 42 })).to.eql(true);
      });

      it('returns false for invalid values', () => {
        expect(validator.check({ foo: 123 })).to.eql(false);
      });
    });

    describe('validate()', () => {
      it('validate(): ok result when valid', () => {
        const result = validator.validate({ foo: 'ok' });
        expect(result).to.eql({ ok: true });
      });

      it('validate(): fails with normalized errors when invalid', () => {
        const result = validator.validate({ foo: {} });
        expect(result.ok).to.eql(false);
        if (!result.ok) {
          expect(result.errors).to.be.an('array').and.have.length.greaterThan(0);
          expect(result.errors?.[0].message).to.include('Expected string');
          expect(result.errors?.[0].path).to.eql(['foo']);
        }
      });
    });
  });
});
