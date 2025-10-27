import { describe, expect, it } from '../../../-test.ts';
import { makeRegistry, Type as T } from '../common.ts';
import { validateSlug, validateSlugAgainstRegistry } from '../mod.ts';

describe('schema.validation / composite', () => {
  const registry = makeRegistry([
    {
      id: 'trait-alpha',
      propsSchema: T.Object({ name: T.Optional(T.String({ minLength: 1 })) }),
    },
    {
      id: 'trait-beta',
      propsSchema: T.Object({}),
    },
  ]);

  it('ok when traits + data are consistent', () => {
    const slug = {
      id: 's1',
      traits: [{ of: 'trait-alpha', as: 'p' }],
      data: { p: { name: 'ok' } },
    };
    const { valid, errors } = validateSlug({ slug, registry, basePath: [] });
    expect(valid).to.eql(true);
    expect(errors).to.eql([]);
  });

  it('aggregates errors from all passes', () => {
    const slug = {
      id: 's1',
      traits: [
        { of: 'nope', as: 'a' }, // unknown trait id
        { of: 'trait-alpha', as: 'a' }, // duplicate alias with the above
      ],
      data: {
        orphan: { name: '' }, // orphan data
        a: { name: '' }, // invalid shape (minLength: 1)
      },
    };

    const errs = validateSlugAgainstRegistry({ slug, registry, basePath: [] });
    expect(errs.length).to.be.greaterThan(0);

    // Spot-check a few independent expectations:
    expect(errs.some((e) => /Unknown trait id/i.test(e.message))).to.eql(true);
    expect(errs.some((e) => /Duplicate .*alias/i.test(e.message))).to.eql(true);
    expect(errs.some((e) => e.path.join('/') === 'data/orphan')).to.eql(true);
    expect(errs.some((e) => e.path.join('/') === 'data/a/name')).to.eql(true);
  });
});
