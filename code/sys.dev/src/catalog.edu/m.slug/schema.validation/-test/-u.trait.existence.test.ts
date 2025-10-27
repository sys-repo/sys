import { describe, expect, it } from '../../../-test.ts';
import { makeRegistry, Type as T } from '../common.ts';
import { validateTraitExistence } from '../mod.ts';

describe('schema.validation / validateTraitExistence', () => {
  const registry = makeRegistry([
    {
      id: 'trait-alpha',
      propsSchema: T.Object({ name: T.Optional(T.String({ minLength: 1 })) }),
    },
  ] as const);

  it('returns [] for non-object or missing traits', () => {
    expect(validateTraitExistence({ slug: null, registry })).to.eql([]);
    expect(validateTraitExistence({ slug: 123, registry })).to.eql([]);
    expect(validateTraitExistence({ slug: { id: 's1' }, registry })).to.eql([]);
  });

  it('no errors when all trait <of> values exist', () => {
    const slug = {
      id: 's1',
      traits: [{ of: 'trait-alpha', as: 'primary' }],
      data: { primary: { name: 'ok' } },
    };
    const errs = validateTraitExistence({ slug, registry });
    expect(errs).to.eql([]);
  });

  it('error when a trait <of> is unknown', () => {
    const slug = {
      id: 's1',
      traits: [
        { of: 'trait-alpha', as: 'a' },
        { of: 'nope', as: 'b' },
      ],
      data: { a: { name: 'x' }, b: { name: 'y' } },
    };
    const errs = validateTraitExistence({ slug, registry });
    expect(errs.length).to.eql(1);

    const e = errs[0]!;
    expect(e.kind).to.eql('semantic');
    expect(e.message).to.contain('Unknown trait id: "nope"');
    expect(e.path).to.eql(['traits', 1, 'of']);
  });

  it('respects basePath when provided', () => {
    const slug = { id: 's1', traits: [{ of: 'nope', as: 'x' }] };
    const errs = validateTraitExistence({
      slug,
      registry,
      basePath: ['root', 'doc', 'section'],
    });
    expect(errs[0]!.path).to.eql(['root', 'doc', 'section', 'traits', 0, 'of']);
  });

  it('ignores traits with non-string <of>', () => {
    const slug = { id: 's1', traits: [{ of: 123, as: 'x' }] };
    const errs = validateTraitExistence({ slug, registry });
    expect(errs).to.eql([]); // existence rule only checks string `of`
  });

  it('[] when traits is empty array', () => {
    const slug = { id: 's1', traits: [], data: {} };
    const errs = validateTraitExistence({ slug, registry });
    expect(errs).to.eql([]);
  });
});
