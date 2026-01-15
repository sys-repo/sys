import { describe, it, expect, expectTypeOf } from '../../../-test.ts';
import { EndpointYamlSchema } from '../mod.ts';

describe('Schema: endpoint', () => {
  it('initial: is type-correct and validates', () => {
    const doc = EndpointYamlSchema.initial();
    const res = EndpointYamlSchema.validate(doc);
    expect(res.ok).to.eql(true);
    expect(res.errors).to.eql([]);
  });

  it('validate: rejects empty object (staging.dir required)', () => {
    const res = EndpointYamlSchema.validate({});
    expect(res.ok).to.eql(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('validate: rejects unknown top-level keys', () => {
    const res = EndpointYamlSchema.validate({ nope: 123 });
    expect(res.ok).to.eql(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('validate: accepts provider.orbiter', () => {
    const value = {
      staging: { dir: './staging' },
      provider: {
        kind: 'orbiter',
        siteId: 'fs',
        domain: 'fs',
      },
      mappings: [],
    };

    const res = EndpointYamlSchema.validate(value);
    expect(res.ok).to.eql(true);
    expect(res.errors).to.eql([]);

    // type guard sanity: shape should be compatible with endpoint YAML doc surface
    expectTypeOf(value).toMatchTypeOf<{
      readonly provider?: unknown;
      readonly mappings?: unknown;
      readonly staging: unknown;
    }>();
  });

  it('validate: rejects provider.orbiter unknown keys', () => {
    const res = EndpointYamlSchema.validate({
      staging: { dir: './staging' },
      provider: {
        kind: 'orbiter',
        siteId: 'fs',
        domain: 'fs',
        extra: true,
      },
    });

    expect(res.ok).to.eql(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('validate: rejects provider.orbiter missing required keys', () => {
    const res = EndpointYamlSchema.validate({
      staging: { dir: './staging' },
      provider: {
        kind: 'orbiter',
        siteId: 'fs',
        // domain missing
      },
    });

    expect(res.ok).to.eql(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('validate: rejects provider with unknown kind', () => {
    const res = EndpointYamlSchema.validate({
      staging: { dir: './staging' },
      provider: { kind: 'wat' },
    });

    expect(res.ok).to.eql(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('validate: rejects bad mapping.mode', () => {
    const res = EndpointYamlSchema.validate({
      staging: { dir: './staging' },
      mappings: [
        {
          dir: { source: '.', staging: '.' },
          mode: 'wat' as unknown,
        },
      ],
    });

    expect(res.ok).to.eql(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('validate: rejects unknown keys inside mapping objects', () => {
    const res = EndpointYamlSchema.validate({
      staging: { dir: './staging' },
      mappings: [
        {
          dir: { source: '.', staging: '.' },
          mode: 'copy',
          extra: true,
        },
      ],
    });

    expect(res.ok).to.eql(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('validate: rejects unknown keys inside dir', () => {
    const res = EndpointYamlSchema.validate({
      staging: { dir: './staging' },
      mappings: [
        {
          dir: { source: '.', staging: '.', extra: 'x' },
          mode: 'copy',
        },
      ],
    });

    expect(res.ok).to.eql(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('validate: accepts provider.noop', () => {
    const res = EndpointYamlSchema.validate({
      staging: { dir: './staging' },
      provider: { kind: 'noop' },
      mappings: [],
    });

    expect(res.ok).to.eql(true);
    expect(res.errors).to.eql([]);
  });

  it('validate: accepts staging.dir', () => {
    const res = EndpointYamlSchema.validate({
      staging: { dir: 'staging-1' },
      mappings: [],
    });

    expect(res.ok).to.eql(true);
    expect(res.errors).to.eql([]);
  });

  it('validate: accepts optional source', () => {
    const res = EndpointYamlSchema.validate({
      source: { dir: './src' },
      staging: { dir: './staging' },
      mappings: [],
    });

    expect(res.ok).to.eql(true);
    expect(res.errors).to.eql([]);
  });

  it('validate: accepts source.dir "."', () => {
    const res = EndpointYamlSchema.validate({
      source: { dir: '.' },
      staging: { dir: './staging' },
      mappings: [],
    });

    expect(res.ok).to.eql(true);
    expect(res.errors).to.eql([]);
  });

  it('validate: rejects unknown keys inside staging', () => {
    const res = EndpointYamlSchema.validate({
      staging: { dir: 'staging-1', extra: true },
    });

    expect(res.ok).to.eql(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });
});
