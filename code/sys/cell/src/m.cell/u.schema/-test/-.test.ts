import { describe, expect, it } from '../../../-test.ts';
import { D, type t } from '../common.ts';
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

    it('accepts an optional stable Cell name', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        name: 'sample:stripe',
      };

      expect(CellSchema.Descriptor.validate(descriptor)).to.eql({ ok: true, errors: [] });
    });

    it('accepts service composition refs', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        services: [
          service('stripe:fixture'),
          service('app.proxy-v1', { config: './-config/app.yaml' }),
        ],
      };

      expect(CellSchema.Descriptor.validate(descriptor)).to.eql({ ok: true, errors: [] });
    });

    it('accepts complete service variant bindings', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        services: [
          {
            ...service('view', { use: 'Serve', from: 'jsr:@sys/tools/serve' }),
            variants: {
              dev: {
                use: 'ViteService',
                from: 'jsr:@sys/driver-vite/service',
                config: './-config/@sys.driver-vite/view.dev.yaml',
              },
            },
          },
        ],
      };

      expect(CellSchema.Descriptor.validate(descriptor)).to.eql({ ok: true, errors: [] });
    });

    it('accepts service startup timeouts', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        services: [
          {
            ...service('view', { timeout: D.services.start.timeout }),
            variants: { dev: serviceVariant({ timeout: 5_000 }) },
          },
        ],
      };

      expect(CellSchema.Descriptor.validate(descriptor)).to.eql({ ok: true, errors: [] });
    });

    it('accepts root leaf and composite task descriptors', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        tasks: [
          task('pull:view'),
          task('deploy:stage', {
            use: 'DeployStageTask',
            from: './-tasks/deploy.stage.ts',
            config: './-config/@sys.tools.deploy/stage.yaml',
          }),
          configlessTask('clean:tmp'),
          compositeTask('sample:deploy', ['pull:view', 'deploy:stage']),
        ],
      };

      expect(CellSchema.Descriptor.validate(descriptor)).to.eql({ ok: true, errors: [] });
    });
  });

  describe('identity', () => {
    it('rejects invalid Cell names', () => {
      const cases = ['Bad', 'bad_name', 'bad/name', 'bad:', 'bad.', 'bad..name', '.'];

      cases.forEach((name) => {
        const descriptor: unknown = { kind: 'cell', version: 1, name };
        const result = CellSchema.Descriptor.validate(descriptor);

        expect(result.ok, name).to.eql(false);
        expect(result.errors.some((error) => error.path === '/name')).to.eql(true);
      });
    });
  });

  describe('services', () => {
    it('rejects invalid service IDs', () => {
      const cases = [
        'Bad',
        'bad_name',
        'bad/name',
        'bad\\name',
        'bad:',
        'bad.',
        'bad..name',
        '.',
        './bad',
        '../bad',
        '/bad',
        '~bad',
      ];

      cases.forEach((name) => {
        const descriptor: unknown = {
          kind: 'cell',
          version: 1,
          services: [service(name)],
        };

        const result = CellSchema.Descriptor.validate(descriptor);
        expect(result.ok).to.eql(false);
        expect(result.errors.some((e) => e.kind === 'schema')).to.eql(true);
      });
    });

    it('rejects duplicate service names', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        services: [service('stripe'), service('stripe')],
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.eql(false);
      expect(result.errors).to.deep.include({
        kind: 'semantic',
        path: '/services/1/name',
        message: 'Duplicate service name: stripe',
      });
    });

    it('rejects non-relative service config paths', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        services: [service('stripe', { config: '-config/@sys.driver-stripe/fixture.yaml' })],
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.eql(false);
      expect(result.errors.filter((e) => e.kind === 'schema').length).to.be.greaterThan(0);
    });

    it('rejects invalid service startup timeouts', () => {
      const cases: readonly unknown[] = [0, -1, 1.5, '1000', '20_000'];

      cases.forEach((timeout) => {
        const base: unknown = {
          kind: 'cell',
          version: 1,
          services: [{ ...service('view'), timeout }],
        };
        const variant: unknown = {
          kind: 'cell',
          version: 1,
          services: [{ ...service('view'), variants: { dev: { ...serviceVariant(), timeout } } }],
        };

        expect(CellSchema.Descriptor.validate(base).ok).to.eql(false);
        expect(CellSchema.Descriptor.validate(variant).ok).to.eql(false);
      });
    });

    it('rejects stale service export selector fields', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        services: [{
          name: 'stripe:fixture',
          from: '@sys/driver-stripe/server/fixture',
          export: 'StripeFixture',
          config: './-config/@sys.driver-stripe/fixture.yaml',
        }],
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.eql(false);
      expect(result.errors.some((e) => e.kind === 'schema')).to.eql(true);
    });

    it('rejects service selectors that omit use', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        services: [{
          name: 'stripe:fixture',
          from: '@sys/driver-stripe/server/fixture',
          config: './-config/@sys.driver-stripe/fixture.yaml',
        }],
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.eql(false);
      expect(result.errors.some((e) => e.kind === 'schema')).to.eql(true);
    });

    it('rejects service ontology fields owned by previous descriptor drafts', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        services: [
          {
            ...service('view'),
            kind: 'http-static',
            for: { views: ['hello'] },
          },
        ],
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.eql(false);
      expect(result.errors.some((e) => e.kind === 'schema')).to.eql(true);
    });

    it('rejects incomplete service variant bindings', () => {
      const cases: readonly unknown[] = [
        { use: 'ViteService', from: 'jsr:@sys/driver-vite/service' },
        { use: 'ViteService', config: './-config/@sys.driver-vite/view.dev.yaml' },
        { from: 'jsr:@sys/driver-vite/service', config: './-config/@sys.driver-vite/view.dev.yaml' },
      ];

      cases.forEach((dev) => {
        const descriptor: unknown = {
          kind: 'cell',
          version: 1,
          services: [{ ...service('view'), variants: { dev } }],
        };

        const result = CellSchema.Descriptor.validate(descriptor);
        expect(result.ok).to.eql(false);
        expect(result.errors.some((e) => e.kind === 'schema')).to.eql(true);
      });
    });

    it('rejects reserved and invalid service variant names', () => {
      const reserved: unknown = {
        kind: 'cell',
        version: 1,
        services: [{ ...service('view'), variants: { default: serviceVariant() } }],
      };
      const invalid: unknown = {
        kind: 'cell',
        version: 1,
        services: [{ ...service('view'), variants: { Bad: serviceVariant() } }],
      };

      const reservedResult = CellSchema.Descriptor.validate(reserved);
      const invalidResult = CellSchema.Descriptor.validate(invalid);

      expect(reservedResult.ok).to.eql(false);
      expect(reservedResult.errors).to.deep.include({
        kind: 'semantic',
        path: '/services/0/variants/default',
        message: 'Reserved service variant name: default',
      });
      expect(invalidResult.ok).to.eql(false);
      expect(invalidResult.errors).to.deep.include({
        kind: 'semantic',
        path: '/services/0/variants/Bad',
        message: 'Invalid service variant name: Bad',
      });
    });

    it('rejects nested variants and unknown variant fields', () => {
      const nested: unknown = {
        kind: 'cell',
        version: 1,
        services: [{ ...service('view'), variants: { dev: { ...serviceVariant(), variants: {} } } }],
      };
      const unknown: unknown = {
        kind: 'cell',
        version: 1,
        services: [{ ...service('view'), variants: { dev: { ...serviceVariant(), label: 'Dev' } } }],
      };

      const nestedResult = CellSchema.Descriptor.validate(nested);
      const unknownResult = CellSchema.Descriptor.validate(unknown);

      expect(nestedResult.ok).to.eql(false);
      expect(unknownResult.ok).to.eql(false);
      expect(nestedResult.errors.some((e) => e.kind === 'schema')).to.eql(true);
      expect(unknownResult.errors.some((e) => e.kind === 'schema')).to.eql(true);
    });
  });

  describe('tasks', () => {
    it('rejects invalid task IDs', () => {
      const cases = [
        'Bad',
        'bad_name',
        'bad/name',
        'bad\\name',
        'bad:',
        'bad.',
        'bad..name',
        '.',
        './bad',
        '../bad',
        '/bad',
        '~bad',
      ];

      cases.forEach((name) => {
        const descriptor: unknown = {
          kind: 'cell',
          version: 1,
          tasks: [task(name)],
        };

        const result = CellSchema.Descriptor.validate(descriptor);
        expect(result.ok).to.eql(false);
        expect(result.errors.some((e) => e.kind === 'schema')).to.eql(true);
      });
    });

    it('rejects duplicate task names', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        tasks: [task('pull:view'), task('pull:view')],
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.eql(false);
      expect(result.errors).to.deep.include({
        kind: 'semantic',
        path: '/tasks/1/name',
        message: 'Duplicate task name: pull:view',
      });
    });

    it('rejects task entries that mix leaf endpoint fields with steps', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        tasks: [
          {
            ...task('sample:deploy'),
            steps: [{ task: 'pull:view' }],
          },
        ],
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.eql(false);
      expect(result.errors.some((e) => e.kind === 'schema')).to.eql(true);
    });

    it('rejects leaf task entries missing endpoint fields', () => {
      const cases: readonly unknown[] = [
        { name: 'pull:view', from: './-tasks/pull.view.ts' },
        { name: 'pull:view', use: 'PullViewTask' },
      ];

      cases.forEach((entry) => {
        const descriptor: unknown = {
          kind: 'cell',
          version: 1,
          tasks: [entry],
        };

        const result = CellSchema.Descriptor.validate(descriptor);
        expect(result.ok).to.eql(false);
        expect(result.errors.some((e) => e.kind === 'schema' || e.kind === 'semantic')).to.eql(
          true,
        );
      });
    });

    it('rejects stale task export selector fields', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        tasks: [{
          name: 'pull:view',
          from: './-tasks/pull.view.ts',
          export: 'PullViewTask',
          config: './-config/@sys.tools.pull/view.yaml',
        }],
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.eql(false);
      expect(result.errors.some((e) => e.kind === 'schema')).to.eql(true);
    });

    it('rejects task selectors that omit use', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        tasks: [{
          name: 'pull:view',
          from: './-tasks/pull.view.ts',
          config: './-config/@sys.tools.pull/view.yaml',
        }],
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.eql(false);
      expect(result.errors.some((e) => e.kind === 'schema')).to.eql(true);
    });

    it('rejects inline executable step fields', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        tasks: [
          task('pull:view'),
          {
            name: 'sample:deploy',
            steps: [{ task: 'pull:view', from: './-tasks/pull.view.ts' }],
          },
        ],
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.eql(false);
      expect(result.errors.some((e) => e.kind === 'schema')).to.eql(true);
    });

    it('rejects missing step task refs', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        tasks: [compositeTask('sample:deploy', ['pull:view'])],
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.eql(false);
      expect(result.errors).to.deep.include({
        kind: 'semantic',
        path: '/tasks/0/steps/0/task',
        message: 'Unknown task reference: pull:view',
      });
    });

    it('rejects task cycles', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        tasks: [
          compositeTask('sample:deploy', ['deploy:stage']),
          compositeTask('deploy:stage', ['sample:deploy']),
        ],
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.eql(false);
      expect(result.errors).to.deep.include({
        kind: 'semantic',
        path: '/tasks/1/steps/0/task',
        message: 'Task cycle detected: sample:deploy -> deploy:stage -> sample:deploy',
      });
    });

    it('rejects non-relative task config paths', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        tasks: [task('pull:view', { config: '-config/@sys.tools.pull/view.yaml' })],
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.eql(false);
      expect(result.errors.filter((e) => e.kind === 'schema').length).to.be.greaterThan(0);
    });

    it('rejects unknown task and step fields', () => {
      const withUnknownTask: unknown = {
        kind: 'cell',
        version: 1,
        tasks: [{ ...task('pull:view'), kind: 'pull' }],
      };
      const withUnknownStep: unknown = {
        kind: 'cell',
        version: 1,
        tasks: [
          task('pull:view'),
          { name: 'sample:deploy', steps: [{ task: 'pull:view', label: 'Pull view' }] },
        ],
      };

      const taskResult = CellSchema.Descriptor.validate(withUnknownTask);
      const stepResult = CellSchema.Descriptor.validate(withUnknownStep);
      expect(taskResult.ok).to.eql(false);
      expect(stepResult.ok).to.eql(false);
      expect(taskResult.errors.some((e) => e.kind === 'schema')).to.eql(true);
      expect(stepResult.errors.some((e) => e.kind === 'schema')).to.eql(true);
    });
  });

  describe('strictness', () => {
    it('accepts top-level services and rejects a dsl.services wrapper', () => {
      const topLevel: unknown = {
        kind: 'cell',
        version: 1,
        services: [service('view')],
      };
      const wrapped: unknown = {
        kind: 'cell',
        version: 1,
        dsl: { services: [service('view')] },
      };

      const topLevelResult = CellSchema.Descriptor.validate(topLevel);
      const wrappedResult = CellSchema.Descriptor.validate(wrapped);

      expect(topLevelResult).to.eql({ ok: true, errors: [] });
      expect(wrappedResult.ok).to.eql(false);
      expect(wrappedResult.errors.some((e) => e.kind === 'schema')).to.eql(true);
    });

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

    it('rejects previous execution vocabulary', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        runtime: { services: [service('view')] },
        actions: [task('pull:view')],
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

type EndpointOverrides = Partial<{
  use: string;
  from: string;
  config: string;
  timeout: t.Msecs;
}>;

function service(
  name: string,
  overrides: EndpointOverrides = {},
): t.Cell.Services.Service {
  return {
    name,
    use: overrides.use ?? 'StripeFixture',
    from: overrides.from ?? '@sys/driver-stripe/server/fixture',
    config: overrides.config ?? './-config/@sys.driver-stripe/fixture.yaml',
    ...(overrides.timeout === undefined ? {} : { timeout: overrides.timeout }),
  };
}

function serviceVariant(overrides: EndpointOverrides = {}): t.Cell.Services.ServiceVariant {
  return {
    use: overrides.use ?? 'ViteService',
    from: overrides.from ?? 'jsr:@sys/driver-vite/service',
    config: overrides.config ?? './-config/@sys.driver-vite/view.dev.yaml',
    ...(overrides.timeout === undefined ? {} : { timeout: overrides.timeout }),
  };
}

function task(
  name: string,
  overrides: EndpointOverrides = {},
): t.Cell.Task.Leaf {
  return {
    name,
    use: overrides.use ?? 'PullViewTask',
    from: overrides.from ?? './-tasks/pull.view.ts',
    config: overrides.config ?? './-config/@sys.tools.pull/view.yaml',
  };
}

function configlessTask(name: string): t.Cell.Task.Leaf {
  return {
    name,
    use: 'CleanTmpTask',
    from: './-tasks/clean.tmp.ts',
  };
}

function compositeTask(name: string, tasks: readonly string[]): t.Cell.Task.Composite {
  return {
    name,
    steps: tasks.map((task) => ({ task })),
  };
}
