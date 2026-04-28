import { describe, expect, it } from '../../../-test.ts';
import { type t } from '../common.ts';
import { CellSchema } from '../mod.ts';
import { loadStripeDescriptor } from '../../-test/u.fixture.ts';

describe(`Cell.Schema`, () => {
  describe('valid descriptors', () => {
    it('validates the Stripe sample descriptor', async () => {
      const descriptor = await loadStripeDescriptor();
      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result).to.eql({ ok: true, errors: [] });
    });

    it('accepts local and pull view sources', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        dsl: { root: './data' },
        views: {
          'stripe.dev': { source: { pull: './-config/@sys.tools.pull/view.yaml' } },
          'hello-world': { source: { local: './view/hello-world' } },
        },
      };

      expect(CellSchema.Descriptor.validate(descriptor)).to.eql({ ok: true, errors: [] });
    });
  });

  describe('view IDs and sources', () => {
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

    it('rejects missing or empty view source', () => {
      const missing: unknown = {
        kind: 'cell',
        version: 1,
        dsl: { root: './data' },
        views: { hello: {} },
      };
      const empty: unknown = {
        kind: 'cell',
        version: 1,
        dsl: { root: './data' },
        views: { hello: { source: {} } },
      };

      expect(CellSchema.Descriptor.validate(missing).ok).to.equal(false);
      expect(CellSchema.Descriptor.validate(empty).ok).to.equal(false);
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
  });

  describe('runtime services', () => {
    it('accepts runtime services for declared views', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        dsl: { root: './data' },
        views: { hello: { source: { local: './view/hello' } } },
        runtime: { services: [{ ...service('view'), for: { views: ['hello'] } }] },
      };

      expect(CellSchema.Descriptor.validate(descriptor)).to.eql({ ok: true, errors: [] });
    });

    it('rejects invalid runtime service IDs', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        dsl: { root: './data' },
        runtime: { services: [service('bad_name')] },
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.equal(false);
      expect(result.errors.some((e) => e.kind === 'schema')).to.equal(true);
    });

    it('rejects empty view references on runtime services', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        dsl: { root: './data' },
        runtime: { services: [{ ...service('view'), for: { views: [] } }] },
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

  describe('paths and strictness', () => {
    it('rejects non-relative paths', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        dsl: { root: 'data' },
        views: { hello: { source: { local: '/view/hello' } } },
        runtime: {
          services: [service('stripe', { config: '-config/@sys.driver-stripe/fixture.yaml' })],
        },
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.equal(false);
      expect(result.errors.filter((e) => e.kind === 'schema').length).to.be.greaterThan(0);
    });

    it('rejects unknown properties', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        dsl: { root: './data' },
        extra: true,
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.equal(false);
      expect(result.errors.some((e) => e.kind === 'schema')).to.equal(true);
    });
  });
});

function service(
  name: string,
  overrides: Partial<t.Cell.Runtime.Service> = {},
): t.Cell.Runtime.Service {
  return {
    name,
    kind: 'http-server',
    from: '@sys/driver-stripe/server/fixture',
    export: 'StripeFixture',
    config: './-config/@sys.driver-stripe/fixture.yaml',
    ...overrides,
  };
}
