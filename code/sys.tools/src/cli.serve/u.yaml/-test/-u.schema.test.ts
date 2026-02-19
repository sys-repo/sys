import { describe, expect, it } from '../../../-test.ts';
import { ServeYamlSchema } from '../mod.ts';

describe('Schema: serve location', () => {
  it('initial: is type-correct and validates', () => {
    const doc = ServeYamlSchema.initial();
    const res = ServeYamlSchema.validate(doc);
    expect(res.ok).to.eql(true);
    expect(res.errors).to.eql([]);
  });

  it('initial: accepts custom name', () => {
    const doc = ServeYamlSchema.initial('Custom Name');
    expect(doc.name).to.eql('Custom Name');
    expect(doc.dir).to.eql('.');

    const res = ServeYamlSchema.validate(doc);
    expect(res.ok).to.eql(true);
  });

  it('validate: rejects empty object (name required)', () => {
    const res = ServeYamlSchema.validate({});
    expect(res.ok).to.eql(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('validate: rejects unknown top-level keys', () => {
    const res = ServeYamlSchema.validate({ name: 'Test', dir: '.', nope: 123 });
    expect(res.ok).to.eql(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('validate: accepts valid minimal doc', () => {
    const res = ServeYamlSchema.validate({ name: 'Test', dir: '.' });
    expect(res.ok).to.eql(true);
    expect(res.errors).to.eql([]);
  });

  it('validate: rejects removed contentTypes key', () => {
    const res = ServeYamlSchema.validate({
      name: 'Test',
      dir: './dist',
      contentTypes: ['image/png', 'application/json'],
    });
    expect(res.ok).to.eql(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('validate: rejects removed remoteBundles key', () => {
    const res = ServeYamlSchema.validate({
      name: 'Test',
      dir: '.',
      remoteBundles: [
        {
          remote: { dist: 'https://example.com/dist.json' },
          local: { dir: 'bundles/example' },
        },
      ],
    });
    expect(res.ok).to.eql(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('validate: rejects missing name', () => {
    const res = ServeYamlSchema.validate({ dir: '.' });
    expect(res.ok).to.eql(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });

  it('validate: rejects missing dir', () => {
    const res = ServeYamlSchema.validate({ name: 'Test' });
    expect(res.ok).to.eql(false);
    expect(res.errors.length).to.be.greaterThan(0);
  });
});
