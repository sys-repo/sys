import { describe, expect, it } from '../../../-test.ts';
import { TraitRegistryDefault } from '../../mod.ts';
import { validateAliasRules, validatePropsShape } from '../mod.ts';

describe('schema.validation / alias + data rules', () => {
  const registry = TraitRegistryDefault;

  it('duplicate alias → at least one error at traits[i].as (2nd+ occurrence)', () => {
    const slug = {
      id: 's1',
      traits: [
        { of: 'video-player', as: 'x' },
        { of: 'video-recorder', as: 'x' }, // dup
      ],
      data: { x: { name: 'ok' } },
    };
    const errs = validateAliasRules({ slug, registry });

    // At least one duplicate-alias diagnostic:
    expect(errs.length).to.be.greaterThan(0);
    const dups = errs.filter((e) => e.message.includes('Duplicate'));
    expect(dups.length).to.be.greaterThan(0);

    // Prefer (and assert) that the 2nd occurrence is flagged at traits[1].as:
    const second = dups.find((e) => e.path.join('/') === 'traits/1/as');
    expect(second).to.exist;
  });

  it('missing data for alias → error at data', () => {
    const slug = {
      id: 's1',
      traits: [{ of: 'video-player', as: 'primary' }],
      data: {}, // missing "primary"
    };
    const errs = validateAliasRules({ slug, registry });

    expect(errs.length).to.eql(1);
    expect(errs[0]!.message).to.contain('Missing data for alias: "primary"');
    expect(errs[0]!.path).to.eql(['data']);
  });

  it('orphan data key → error at data.<key>', () => {
    const slug = {
      id: 's1',
      traits: [{ of: 'video-player', as: 'primary' }],
      // include the required alias data to avoid the "missing data" error
      data: { primary: { name: 'ok' }, orphan: { name: 'ok' } },
    };
    const errs = validateAliasRules({ slug, registry });

    // Expect an orphan diagnostic pointing at data.orphan
    const orphan = errs.find((e) => e.path.join('/') === 'data/orphan');
    expect(orphan).to.exist;
    expect(orphan!.message).to.satisfy(
      (m: string) => m.includes('Orphan') && m.includes('"orphan"'),
    );
  });

  it('alias rules respect basePath', () => {
    const slug = {
      id: 's1',
      traits: [{ of: 'video-player', as: 'primary' }],
      data: {}, // missing primary
    };
    const errs = validateAliasRules({ slug, registry, basePath: ['root', 'doc'] });
    expect(errs[0]!.path).to.eql(['root', 'doc', 'data']);
  });
});

describe('schema.validation / data shape', () => {
  const registry = TraitRegistryDefault;

  it('valid shape → no errors', () => {
    const slug = {
      id: 's1',
      traits: [{ of: 'video-player', as: 'primary' }],
      data: { primary: { name: 'ok' } },
    };
    const errs = validatePropsShape({ slug, registry });
    expect(errs).to.eql([]);
  });

  it('invalid shape → nested path under data.alias.*', () => {
    const slug = {
      id: 's1',
      traits: [{ of: 'video-player', as: 'primary' }],
      data: { primary: { name: '' } }, // minLength: 1
    };
    const errs = validatePropsShape({ slug, registry });

    expect(errs.length).to.eql(1);
    expect(errs[0]!.kind).to.eql('semantic');
    expect(errs[0]!.path).to.eql(['data', 'primary', 'name']);

    const msg = errs[0]!.message.toLowerCase();
    expect(msg).to.satisfy((m: string) => m.includes('string') && m.includes('length'));
  });

  it('data shape respects basePath', () => {
    const slug = {
      id: 's1',
      traits: [{ of: 'video-player', as: 'primary' }],
      data: { primary: { name: '' } },
    };
    const errs = validatePropsShape({ slug, registry, basePath: ['root'] });
    expect(errs[0]!.path).to.eql(['root', 'data', 'primary', 'name']);
  });

  it('skips orphan data + unknown trait ids (handled by other passes)', () => {
    const slug = {
      id: 's1',
      traits: [
        { of: 'video-player', as: 'primary' },
        { of: 'nope', as: 'x' }, // unknown trait id -> handled in existence validator, not here
      ],
      data: {
        primary: { name: '' }, // invalid → should be reported
        orphan: { name: '' }, // orphan → ignored by shape pass
      },
    };
    const errs = validatePropsShape({ slug, registry });

    // Only one error for invalid primary shape:
    expect(errs.length).to.eql(1);
    expect(errs[0]!.path).to.eql(['data', 'primary', 'name']);
  });
});
