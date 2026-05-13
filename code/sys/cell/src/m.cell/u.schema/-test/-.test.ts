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

    it('accepts root leaf and composite task descriptors', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        tasks: [
          task('pull:view'),
          task('deploy:stage', {
            from: './-tasks/deploy.stage.ts',
            use: 'DeployStageTask',
            config: './-config/@sys.tools.deploy/stage.yaml',
          }),
          configlessTask('clean:tmp'),
          compositeTask('sample:deploy', ['pull:view', 'deploy:stage']),
        ],
      };

      expect(CellSchema.Descriptor.validate(descriptor)).to.eql({ ok: true, errors: [] });
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
  from: string;
  use: string;
  config: string;
}>;

function service(
  name: string,
  overrides: EndpointOverrides = {},
): t.Cell.Services.Service {
  return {
    name,
    from: overrides.from ?? '@sys/driver-stripe/server/fixture',
    use: overrides.use ?? 'StripeFixture',
    config: overrides.config ?? './-config/@sys.driver-stripe/fixture.yaml',
  };
}

function task(
  name: string,
  overrides: EndpointOverrides = {},
): t.Cell.Task.Leaf {
  return {
    name,
    from: overrides.from ?? './-tasks/pull.view.ts',
    use: overrides.use ?? 'PullViewTask',
    config: overrides.config ?? './-config/@sys.tools.pull/view.yaml',
  };
}

function configlessTask(name: string): t.Cell.Task.Leaf {
  return {
    name,
    from: './-tasks/clean.tmp.ts',
    use: 'CleanTmpTask',
  };
}

function compositeTask(name: string, tasks: readonly string[]): t.Cell.Task.Composite {
  return {
    name,
    steps: tasks.map((task) => ({ task })),
  };
}
