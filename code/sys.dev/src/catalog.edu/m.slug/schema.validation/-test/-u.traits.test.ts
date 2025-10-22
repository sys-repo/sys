import { describe, expect, it } from '../../../-test.ts';
import { TraitRegistryDefault } from '../../mod.ts';
import { validateSlug, validateSlugAgainstRegistry } from '../mod.ts';

describe('schema.validation / composite', () => {
  const registry = TraitRegistryDefault;

  it('ok when traits + props are consistent', () => {
    const slug = {
      id: 's1',
      traits: [{ id: 'video-player', as: 'p' }],
      props: { p: { name: 'ok' } },
    };
    const { valid, errors } = validateSlug({ slug, registry, basePath: [] });
    expect(valid).to.eql(true);
    expect(errors).to.eql([]);
  });

  it('aggregates errors from all passes', () => {
    const slug = {
      id: 's1',
      traits: [
        { id: 'nope', as: 'a' },
        { id: 'video-player', as: 'a' },
      ], // dup alias + unknown id
      props: { orphan: { name: '' }, a: { name: '' } }, // orphan + invalid shape
    };
    const errs = validateSlugAgainstRegistry({ slug, registry, basePath: [] });
    expect(errs.length).to.be.greaterThan(0);

    // Spot-check a few:
    expect(errs.some((e) => e.message.includes('Unknown trait id'))).to.eql(true);
    expect(errs.some((e) => e.message.includes('Duplicate trait alias'))).to.eql(true);
    expect(errs.some((e) => e.path.join('/') === 'props/orphan')).to.eql(true);
  });
});
