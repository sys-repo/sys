import { describe, it, expect, expectTypeOf } from '../../-test.ts';
import { EndpointYamlSchema } from '../u.endpoints.schema.ts';

describe('Schema: endpoint', () => {
  it('initial: is type-correct and validates', () => {
    const doc = EndpointYamlSchema.initial();
    const res = EndpointYamlSchema.validate(doc);
    expect(res.ok).to.equal(true);
    expect(res.errors).to.eql([]);
  });

  it('validate: accepts empty object (all optional)', () => {
    const res = EndpointYamlSchema.validate({});
    expect(res.ok).to.equal(true);
    expect(res.errors).to.eql([]);
  });

  it('validate: rejects unknown top-level keys', () => {
    const res = EndpointYamlSchema.validate({ nope: 123 });
    expect(res.ok).to.equal(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('validate: accepts provider.orbiter', () => {
    const value = {
      provider: {
        kind: 'orbiter',
        siteId: 'fs',
        domain: 'fs',
        buildDir: 'dist',
      },
      mappings: [],
    };

    const res = EndpointYamlSchema.validate(value);
    expect(res.ok).to.equal(true);
    expect(res.errors).to.eql([]);

    // type guard sanity: shape should be compatible with endpoint YAML doc surface
    expectTypeOf(value).toMatchTypeOf<{
      readonly provider?: unknown;
      readonly mappings?: unknown;
    }>();
  });

  it('validate: rejects provider.orbiter unknown keys', () => {
    const res = EndpointYamlSchema.validate({
      provider: {
        kind: 'orbiter',
        siteId: 'fs',
        domain: 'fs',
        buildDir: 'dist',
        extra: true,
      },
    });

    expect(res.ok).to.equal(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('validate: rejects provider.orbiter missing required keys', () => {
    const res = EndpointYamlSchema.validate({
      provider: {
        kind: 'orbiter',
        siteId: 'fs',
        domain: 'fs',
        // buildDir missing
      },
    });

    expect(res.ok).to.equal(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('validate: rejects provider with unknown kind', () => {
    const res = EndpointYamlSchema.validate({
      provider: {
        kind: 'wat',
      },
    });

    expect(res.ok).to.equal(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('validate: rejects bad mapping.mode', () => {
    const res = EndpointYamlSchema.validate({
      mappings: [
        {
          dir: { source: '.', staging: '.' },
          mode: 'wat' as unknown,
        },
      ],
    });

    expect(res.ok).to.equal(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('validate: rejects unknown keys inside mapping objects', () => {
    const res = EndpointYamlSchema.validate({
      mappings: [
        {
          dir: { source: '.', staging: '.' },
          mode: 'copy',
          extra: true,
        },
      ],
    });

    expect(res.ok).to.equal(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('validate: rejects unknown keys inside dir', () => {
    const res = EndpointYamlSchema.validate({
      mappings: [
        {
          dir: { source: '.', staging: '.', extra: 'x' },
          mode: 'copy',
        },
      ],
    });

    expect(res.ok).to.equal(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });
});
