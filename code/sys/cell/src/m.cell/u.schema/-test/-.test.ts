import { describe, expect, it } from '../../../-test.ts';
import { type t } from '../common.ts';
import { CellSchema } from '../mod.ts';
import { loadStripeDescriptor } from './u.fixture.ts';

describe(`Cell.Schema`, () => {
  it('validates the Stripe sample descriptor', async () => {
    const descriptor = await loadStripeDescriptor();
    const result = CellSchema.Descriptor.validate(descriptor);
    expect(result).to.eql({ ok: true, errors: [] });
  });

  it('rejects invalid view IDs', () => {
    const descriptor: unknown = {
      kind: 'cell',
      version: 1,
      dsl: { root: './data' },
      views: { 'Bad_View': { source: { local: './view/bad' } } },
    };

    const result = CellSchema.Descriptor.validate(descriptor);
    expect(result.ok).to.equal(false);
    expect(result.errors).to.deep.include({
      kind: 'semantic',
      path: '/views/Bad_View',
      message: 'Invalid view ID: Bad_View',
    });
  });

  it('enforces view source as pull OR local', () => {
    const descriptor: unknown = {
      kind: 'cell',
      version: 1,
      dsl: { root: './data' },
      views: {
        hello: { source: { pull: './-config/@sys.tools.pull/view.yaml', local: './view/hello' } },
      },
    };

    const result = CellSchema.Descriptor.validate(descriptor);
    expect(result.ok).to.equal(false);
    expect(result.errors.some((e) => e.kind === 'schema')).to.equal(true);
  });

  it('rejects duplicate runtime service names', () => {
    const descriptor: unknown = {
      kind: 'cell',
      version: 1,
      dsl: { root: './data' },
      runtime: { services: [service('stripe'), service('stripe')] },
    };

    const result = CellSchema.Descriptor.validate(descriptor);
    expect(result.ok).to.equal(false);
    expect(result.errors).to.deep.include({
      kind: 'semantic',
      path: '/runtime/services/1/name',
      message: 'Duplicate runtime service name: stripe',
    });
  });

  it('rejects runtime services for unknown views', () => {
    const descriptor: unknown = {
      kind: 'cell',
      version: 1,
      dsl: { root: './data' },
      views: { hello: { source: { local: './view/hello' } } },
      runtime: { services: [{ ...service('view'), for: { views: ['missing'] } }] },
    };

    const result = CellSchema.Descriptor.validate(descriptor);
    expect(result.ok).to.equal(false);
    expect(result.errors).to.deep.include({
      kind: 'semantic',
      path: '/runtime/services/0/for/views/0',
      message: 'Runtime service references unknown view: missing',
    });
  });
});

function service(name: string): t.Cell.Runtime.Service {
  return {
    name,
    kind: 'http-server',
    from: '@sys/driver-stripe/server/fixture',
    export: 'StripeFixture',
    config: './-config/@sys.driver-stripe/fixture.yaml',
  };
}
