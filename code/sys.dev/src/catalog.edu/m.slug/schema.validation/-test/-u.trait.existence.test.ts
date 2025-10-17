import { describe, expect, it } from '../../../-test.ts';
import { TraitRegistryDefault } from '../../mod.ts';
import { validateTraitExistence } from '../mod.ts';

describe('schema.validation / validateTraitExistence', () => {
  it('returns [] for non-object or missing traits', () => {
    const registry = TraitRegistryDefault;
    expect(validateTraitExistence({ slug: null, registry })).to.eql([]);
    expect(validateTraitExistence({ slug: 123, registry })).to.eql([]);
    expect(validateTraitExistence({ slug: { id: 's1' }, registry })).to.eql([]);
  });

  it('no errors when all trait <ids> exist', () => {
    const slug = {
      id: 's1',
      traits: [{ id: 'video-player', as: 'primary' }],
      props: { primary: { name: 'ok' } },
    };
    const errs = validateTraitExistence({ slug, registry: TraitRegistryDefault });
    expect(errs).to.eql([]);
  });

  it('error when a trait id is <unknown>', () => {
    const slug = {
      id: 's1',
      traits: [
        { id: 'video-player', as: 'a' },
        { id: 'nope', as: 'b' },
      ],
      props: { a: { name: 'x' }, b: { name: 'y' } },
    };
    const errs = validateTraitExistence({ slug, registry: TraitRegistryDefault });
    expect(errs.length).to.eql(1);
    const e = errs[0]!;
    expect(e.kind).to.eql('semantic');
    expect(e.message).to.contain('Unknown trait id: "nope"');
    expect(e.path).to.eql(['traits', 1, 'id']);
  });

  it('respects basePath when provided', () => {
    const slug = { id: 's1', traits: [{ id: 'nope', as: 'x' }] };
    const errs = validateTraitExistence({
      slug,
      registry: TraitRegistryDefault,
      basePath: ['root', 'doc', 'section'],
    });
    expect(errs[0]!.path).to.eql(['root', 'doc', 'section', 'traits', 0, 'id']);
  });

  it('ignores traits with non-string ids', () => {
    const slug = { id: 's1', traits: [{ id: 123, as: 'x' }] };
    const errs = validateTraitExistence({ slug, registry: TraitRegistryDefault });
    expect(errs).to.eql([]); // existence rule only checks string ids
  });

  it('[] when traits is empty array', () => {
    const slug = { id: 's1', traits: [], props: {} };
    const errs = validateTraitExistence({ slug, registry: TraitRegistryDefault });
    expect(errs).to.eql([]);
  });
});
