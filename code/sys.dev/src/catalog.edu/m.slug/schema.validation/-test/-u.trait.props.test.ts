import { describe, expect, it } from '../../../-test.ts';
import { TraitRegistryDefault } from '../../mod.ts';
import { validateAliasRules, validatePropsShape } from '../mod.ts';

describe('schema.validation / alias + props rules', () => {
  const registry = TraitRegistryDefault;

  it('duplicate alias → error at traits[i].as (2nd+ occurrence)', () => {
    const slug = {
      id: 's1',
      traits: [
        { id: 'video-player', as: 'x' },
        { id: 'video-recorder', as: 'x' }, // dup
      ],
      props: { x: { name: 'ok' } },
    };
    const errs = validateAliasRules({ slug, registry });
    expect(errs.length).to.eql(1);
    expect(errs[0]!.kind).to.eql('semantic');
    expect(errs[0]!.message).to.contain('Duplicate trait alias: "x"');
    expect(errs[0]!.path).to.eql(['traits', 1, 'as']);
  });

  it('missing props for alias → error at props', () => {
    const slug = {
      id: 's1',
      traits: [{ id: 'video-player', as: 'primary' }],
      props: {}, // missing primary
    };
    const errs = validateAliasRules({ slug, registry });
    expect(errs.length).to.eql(1);
    expect(errs[0]!.message).to.contain('Missing props for alias: "primary"');
    expect(errs[0]!.path).to.eql(['props']);
  });

  it('orphan props key → error at props.<key>', () => {
    const slug = {
      id: 's1',
      traits: [{ id: 'video-player', as: 'primary' }],
      // provide the required alias props to avoid the "missing props" error
      props: { primary: { name: 'ok' }, orphan: { name: 'ok' } },
    };
    const errs = validateAliasRules({ slug, registry });
    expect(errs.length).to.eql(1);
    expect(errs[0]!.message).to.contain('Orphan props: "orphan"');
    expect(errs[0]!.path).to.eql(['props', 'orphan']);
  });

  it('alias rules respect basePath', () => {
    const slug = {
      id: 's1',
      traits: [{ id: 'video-player', as: 'primary' }],
      props: {}, // missing primary
    };
    const errs = validateAliasRules({ slug, registry, basePath: ['root', 'doc'] });
    expect(errs[0]!.path).to.eql(['root', 'doc', 'props']);
  });
});

describe('schema.validation / props shape', () => {
  const registry = TraitRegistryDefault;

  it('valid shape → no errors', () => {
    const slug = {
      id: 's1',
      traits: [{ id: 'video-player', as: 'primary' }],
      props: { primary: { name: 'ok' } },
    };
    const errs = validatePropsShape({ slug, registry });
    expect(errs).to.eql([]);
  });

  it('invalid shape → nested path under props.alias.*', () => {
    const slug = {
      id: 's1',
      traits: [{ id: 'video-player', as: 'primary' }],
      props: { primary: { name: '' } }, // minLength: 1
    };
    const errs = validatePropsShape({ slug, registry });
    expect(errs.length).to.eql(1);
    expect(errs[0]!.kind).to.eql('semantic');
    expect(errs[0]!.path).to.eql(['props', 'primary', 'name']);

    const msg = errs[0]!.message.toLowerCase();
    expect(msg).to.satisfy((m: string) => m.includes('string') && m.includes('length'));
  });

  it('props shape respects basePath', () => {
    const slug = {
      id: 's1',
      traits: [{ id: 'video-player', as: 'primary' }],
      props: { primary: { name: '' } },
    };
    const errs = validatePropsShape({ slug, registry, basePath: ['root'] });
    expect(errs[0]!.path).to.eql(['root', 'props', 'primary', 'name']);
  });

  it('skips orphan props + unknown trait ids (handled by other passes)', () => {
    const slug = {
      id: 's1',
      traits: [{ id: 'video-player', as: 'primary' }],
      props: {
        primary: { name: '' }, // invalid → should be reported
        orphan: { name: '' }, // orphan → should be ignored here
      },
    };
    const errs = validatePropsShape({ slug, registry });
    expect(errs.length).to.eql(1);
    expect(errs[0]!.path).to.eql(['props', 'primary', 'name']);
  });
});
