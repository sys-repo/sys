import { describe, it, expect, expectTypeOf } from '../../-test.ts';
import { EndpointYamlSchema } from '../u.endpoint.schema.ts';

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
