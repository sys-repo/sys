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

    it('accepts the minimal microkernel descriptor', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
      };

      expect(CellSchema.Descriptor.validate(descriptor)).to.eql({ ok: true, errors: [] });
    });

    it('accepts runtime service composition refs', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        runtime: {
          services: [
            service('stripe:fixture'),
            service('app.proxy-v1', { config: './-config/app.yaml' }),
          ],
        },
      };

      expect(CellSchema.Descriptor.validate(descriptor)).to.eql({ ok: true, errors: [] });
    });
  });

  describe('runtime services', () => {
    it('rejects invalid runtime service IDs', () => {
      const cases = ['Bad', 'bad_name', 'bad/name', 'bad:', 'bad..name'];

      cases.forEach((name) => {
        const descriptor: unknown = {
          kind: 'cell',
          version: 1,
          runtime: { services: [service(name)] },
        };

        const result = CellSchema.Descriptor.validate(descriptor);
        expect(result.ok).to.eql(false);
        expect(result.errors.some((e) => e.kind === 'schema')).to.eql(true);
      });
    });

    it('rejects duplicate runtime service names', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        runtime: { services: [service('stripe'), service('stripe')] },
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.eql(false);
      expect(result.errors).to.deep.include({
        kind: 'semantic',
        path: '/runtime/services/1/name',
        message: 'Duplicate runtime service name: stripe',
      });
    });

    it('rejects non-relative service config paths', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        runtime: {
          services: [service('stripe', { config: '-config/@sys.driver-stripe/fixture.yaml' })],
        },
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.eql(false);
      expect(result.errors.filter((e) => e.kind === 'schema').length).to.be.greaterThan(0);
    });

    it('rejects service ontology fields owned by previous descriptor drafts', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        runtime: {
          services: [
            {
              ...service('view'),
              kind: 'http-static',
              for: { views: ['hello'] },
            },
          ],
        },
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.eql(false);
      expect(result.errors.some((e) => e.kind === 'schema')).to.eql(true);
    });
  });

  describe('strictness', () => {
    it('rejects descriptor fields that model Cell state ontology', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        dsl: { root: './data' },
        views: { hello: { source: { local: './view/hello' } } },
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.eql(false);
      expect(result.errors.some((e) => e.kind === 'schema')).to.eql(true);
    });

    it('rejects unknown properties', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        extra: true,
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.eql(false);
      expect(result.errors.some((e) => e.kind === 'schema')).to.eql(true);
    });
  });
});

function service(
  name: string,
  overrides: Partial<t.Cell.Runtime.Service> = {},
): t.Cell.Runtime.Service {
  return {
    name,
    from: '@sys/driver-stripe/server/fixture',
    export: 'StripeFixture',
    config: './-config/@sys.driver-stripe/fixture.yaml',
    ...overrides,
  };
}
