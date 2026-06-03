import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { providerlessPrebuiltStageDoc } from '../../-test/u.fixture.ts';
import { EndpointYamlSchema } from '../mod.ts';

describe('Schema: endpoint', () => {
  describe('initial', () => {
    it('is type-correct and validates', () => {
      const doc = EndpointYamlSchema.initial();
      const res = EndpointYamlSchema.validate(doc);
      expect(res.ok).to.eql(true);
      expect(res.errors).to.eql([]);
    });
  });

  describe('validate', () => {
    describe('document', () => {
      it('rejects empty object (staging.dir required)', () => {
        const res = EndpointYamlSchema.validate({});
        expect(res.ok).to.eql(false);
        expect(res.errors.length).to.be.greaterThan(0);
      });

      it('rejects unknown top-level keys', () => {
        const res = EndpointYamlSchema.validate({ nope: 123 });
        expect(res.ok).to.eql(false);
        expect(res.errors.length).to.be.greaterThan(0);
      });

      it('accepts providerless prebuilt copy stage endpoint', () => {
        const res = EndpointYamlSchema.validate(providerlessPrebuiltStageDoc());

        expect(res.ok).to.eql(true);
        expect(res.errors).to.eql([]);
      });
    });

    describe('provider', () => {
      it('accepts provider.orbiter', () => {
        const value = {
          staging: { dir: './staging' },
          provider: {
            kind: 'orbiter',
            siteId: 'abc123',
            domain: 'example.com',
          },
          mappings: [],
        };

        const res = EndpointYamlSchema.validate(value);
        expect(res.ok).to.eql(true);
        expect(res.errors).to.eql([]);

        // type guard sanity: shape should be compatible with endpoint YAML doc surface
        expectTypeOf(value).toMatchTypeOf<{
          readonly provider?: unknown;
          readonly mappings?: unknown;
          readonly staging: unknown;
        }>();
      });

      it('accepts provider.orbiter shards', () => {
        const res = EndpointYamlSchema.validate({
          staging: { dir: './staging' },
          provider: {
            kind: 'orbiter',
            siteId: 'fs',
            domain: 'fs',
            shards: {
              total: 64,
              only: [1, 2],
              siteIds: { 1: 'a', 2: 'b' },
            },
          },
          mappings: [],
        });

        expect(res.ok).to.eql(true);
        expect(res.errors).to.eql([]);
      });

      it('accepts provider.r2', () => {
        const res = EndpointYamlSchema.validate({
          staging: { dir: './staging' },
          provider: {
            kind: 'r2',
            accountId: 'account-1',
            bucket: 'deploy-bucket',
            prefix: 'deploy/site',
            readOrigin: 'https://cdn.example.com',
            credentials: {
              accessKeyId: 'key-1',
              secretAccessKey: 'secret-1',
            },
          },
          mappings: [],
        });

        expect(res.ok).to.eql(true);
        expect(res.errors).to.eql([]);
      });

      it('rejects provider.r2 unknown keys', () => {
        const res = EndpointYamlSchema.validate({
          staging: { dir: './staging' },
          provider: {
            kind: 'r2',
            accountId: 'account-1',
            bucket: 'deploy-bucket',
            prefix: 'deploy/site',
            credentials: {
              accessKeyId: 'key-1',
              secretAccessKey: 'secret-1',
            },
            endpoint: 'https://example.com',
          },
        });

        expect(res.ok).to.eql(false);
        expect(res.errors.length).to.be.greaterThan(0);
      });

      it('rejects provider.r2 missing required keys', () => {
        const res = EndpointYamlSchema.validate({
          staging: { dir: './staging' },
          provider: {
            kind: 'r2',
            accountId: 'account-1',
            bucket: 'deploy-bucket',
            prefix: 'deploy/site',
          },
        });

        expect(res.ok).to.eql(false);
        expect(res.errors.length).to.be.greaterThan(0);
      });

      it('rejects provider.deno as an unsupported tools deploy provider', () => {
        const res = EndpointYamlSchema.validate({
          staging: { dir: './staging' },
          provider: {
            kind: 'deno',
            app: 'my-app',
          },
          mappings: [],
        });

        expect(res.ok).to.eql(false);
        expect(res.errors.length).to.be.greaterThan(0);
      });

      it('rejects provider.orbiter unknown keys', () => {
        const res = EndpointYamlSchema.validate({
          staging: { dir: './staging' },
          provider: {
            kind: 'orbiter',
            siteId: 'fs',
            domain: 'fs',
            extra: true,
          },
        });

        expect(res.ok).to.eql(false);
        expect(res.errors.length).to.be.greaterThan(0);
      });

      it('rejects provider.orbiter missing required keys', () => {
        const res = EndpointYamlSchema.validate({
          staging: { dir: './staging' },
          provider: {
            kind: 'orbiter',
            siteId: 'fs',
            // domain missing
          },
        });

        expect(res.ok).to.eql(false);
        expect(res.errors.length).to.be.greaterThan(0);
      });

      it('rejects provider with unknown kind', () => {
        const res = EndpointYamlSchema.validate({
          staging: { dir: './staging' },
          provider: { kind: 'wat' },
        });

        expect(res.ok).to.eql(false);
        expect(res.errors.length).to.be.greaterThan(0);
      });

      it('accepts provider.noop', () => {
        const res = EndpointYamlSchema.validate({
          staging: { dir: './staging' },
          provider: { kind: 'noop' },
          mappings: [],
        });

        expect(res.ok).to.eql(true);
        expect(res.errors).to.eql([]);
      });
    });

    describe('mappings', () => {
      it('rejects bad mapping.mode', () => {
        const res = EndpointYamlSchema.validate({
          staging: { dir: './staging' },
          mappings: [
            {
              mode: 'wat' as unknown,
              dir: { source: '.', staging: '.' },
            },
          ],
        });

        expect(res.ok).to.eql(false);
        expect(res.errors.length).to.be.greaterThan(0);
      });

      it('accepts mapping.mode "index"', () => {
        const res = EndpointYamlSchema.validate({
          staging: { dir: './staging' },
          mappings: [
            {
              mode: 'index',
              dir: { source: '.', staging: '.' },
            },
          ],
        });

        expect(res.ok).to.eql(true);
        expect(res.errors).to.eql([]);
      });

      it('rejects unknown keys inside mapping objects', () => {
        const res = EndpointYamlSchema.validate({
          staging: { dir: './staging' },
          mappings: [
            {
              mode: 'copy',
              dir: { source: '.', staging: '.' },
              extra: true,
            },
          ],
        });

        expect(res.ok).to.eql(false);
        expect(res.errors.length).to.be.greaterThan(0);
      });

      it('accepts shard config on mappings', () => {
        const res = EndpointYamlSchema.validate({
          staging: { dir: './staging' },
          mappings: [
            {
              mode: 'copy',
              dir: { source: './video/partition-<shard>', staging: './<shard>.video.cdn.example' },
              shards: { total: 64, requireAll: true },
            },
          ],
        });

        expect(res.ok).to.eql(true);
        expect(res.errors).to.eql([]);
      });

      it('rejects unknown keys inside dir', () => {
        const res = EndpointYamlSchema.validate({
          staging: { dir: './staging' },
          mappings: [
            {
              mode: 'copy',
              dir: { source: '.', staging: '.', extra: 'x' },
            },
          ],
        });

        expect(res.ok).to.eql(false);
        expect(res.errors.length).to.be.greaterThan(0);
      });
    });

    describe('source', () => {
      it('accepts optional source', () => {
        const res = EndpointYamlSchema.validate({
          source: { dir: './src' },
          staging: { dir: './staging' },
          mappings: [],
        });

        expect(res.ok).to.eql(true);
        expect(res.errors).to.eql([]);
      });

      it('accepts source.dir "."', () => {
        const res = EndpointYamlSchema.validate({
          source: { dir: '.' },
          staging: { dir: './staging' },
          mappings: [],
        });

        expect(res.ok).to.eql(true);
        expect(res.errors).to.eql([]);
      });
    });

    describe('staging', () => {
      it('accepts staging.dir', () => {
        const res = EndpointYamlSchema.validate({
          staging: { dir: 'staging-1' },
          mappings: [],
        });

        expect(res.ok).to.eql(true);
        expect(res.errors).to.eql([]);
      });

      it('accepts staging.html.buildReset', () => {
        const res = EndpointYamlSchema.validate({
          staging: { dir: './staging', html: { buildReset: true } },
          mappings: [],
        });

        expect(res.ok).to.eql(true);
        expect(res.errors).to.eql([]);
      });

      it('accepts staging.serve.port', () => {
        const res = EndpointYamlSchema.validate({
          staging: { dir: './staging', serve: { port: 4041 } },
          mappings: [],
        });

        expect(res.ok).to.eql(true);
        expect(res.errors).to.eql([]);
      });

      it('rejects unknown keys inside staging', () => {
        const res = EndpointYamlSchema.validate({
          staging: { dir: 'staging-1', extra: true },
        });

        expect(res.ok).to.eql(false);
        expect(res.errors.length).to.be.greaterThan(0);
      });

      it('rejects unknown keys inside staging.html', () => {
        const res = EndpointYamlSchema.validate({
          staging: { dir: 'staging-1', html: { buildReset: true, extra: true } },
        });

        expect(res.ok).to.eql(false);
        expect(res.errors.length).to.be.greaterThan(0);
      });

      it('rejects unknown keys inside staging.serve', () => {
        const res = EndpointYamlSchema.validate({
          staging: { dir: 'staging-1', serve: { port: 4040, extra: true } },
        });

        expect(res.ok).to.eql(false);
        expect(res.errors.length).to.be.greaterThan(0);
      });
    });
  });
});
