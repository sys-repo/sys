import { describe, it, expect, expectTypeOf } from '../../../-test.ts';
import { OrbiterProviderSchema } from '../u.orbiter.schema.ts';

describe('Schema: Orbiter Provider', () => {
  it('initial: is type-correct and validates', () => {
    const doc = OrbiterProviderSchema.initial();
    expectTypeOf(doc).toEqualTypeOf<ReturnType<typeof OrbiterProviderSchema.initial>>();

    const res = OrbiterProviderSchema.validate(doc);
    expect(res.ok).to.eql(true);
    expect(res.errors).to.eql([]);
  });

  it('validate: accepts a minimal valid orbiter provider', () => {
    const res = OrbiterProviderSchema.validate({
      kind: 'orbiter',
      siteId: 'site',
      domain: 'fs',
      buildDir: 'dist',
    });

    expect(res.ok).to.eql(true);
    expect(res.errors).to.eql([]);
  });

  it('validate: rejects unknown keys', () => {
    const res = OrbiterProviderSchema.validate({
      kind: 'orbiter',
      siteId: 'site',
      domain: 'fs',
      buildDir: 'dist',
      extra: true,
    });

    expect(res.ok).to.eql(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('validate: rejects wrong kind', () => {
    const res = OrbiterProviderSchema.validate({
      kind: 'wat',
      siteId: 'site',
      domain: 'fs',
      buildDir: 'dist',
    });

    expect(res.ok).to.eql(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('validate: rejects missing required fields', () => {
    const res = OrbiterProviderSchema.validate({ kind: 'orbiter' });

    expect(res.ok).to.eql(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('validate: accepts optional buildCommand', () => {
    const res = OrbiterProviderSchema.validate({
      kind: 'orbiter',
      siteId: 'site',
      domain: 'fs',
      buildDir: 'dist',
      buildCommand: 'echo no-op',
    });

    expect(res.ok).to.eql(true);
    expect(res.errors).to.eql([]);
  });
});
