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

    it('accepts root leaf and composite action descriptors', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        actions: [
          action('pull:view'),
          action('deploy:stage', {
            from: './-actions/deploy.stage.ts',
            export: 'DeployStageAction',
            config: './-config/@sys.tools.deploy/stage.yaml',
          }),
          configlessAction('clean:tmp'),
          compositeAction('sample:deploy', ['pull:view', 'deploy:stage']),
        ],
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

  describe('actions', () => {
    it('rejects invalid action IDs', () => {
      const cases = ['Bad', 'bad_name', 'bad/name', 'bad:', 'bad..name'];

      cases.forEach((name) => {
        const descriptor: unknown = {
          kind: 'cell',
          version: 1,
          actions: [action(name)],
        };

        const result = CellSchema.Descriptor.validate(descriptor);
        expect(result.ok).to.eql(false);
        expect(result.errors.some((e) => e.kind === 'schema')).to.eql(true);
      });
    });

    it('rejects duplicate action names', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        actions: [action('pull:view'), action('pull:view')],
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.eql(false);
      expect(result.errors).to.deep.include({
        kind: 'semantic',
        path: '/actions/1/name',
        message: 'Duplicate action name: pull:view',
      });
    });

    it('rejects action entries that mix leaf endpoint fields with steps', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        actions: [
          {
            ...action('sample:deploy'),
            steps: [{ action: 'pull:view' }],
          },
        ],
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.eql(false);
      expect(result.errors.some((e) => e.kind === 'schema')).to.eql(true);
    });

    it('rejects leaf action entries missing endpoint fields', () => {
      const cases: readonly unknown[] = [
        { name: 'pull:view', from: './-actions/pull.view.ts' },
        { name: 'pull:view', export: 'PullViewAction' },
      ];

      cases.forEach((entry) => {
        const descriptor: unknown = {
          kind: 'cell',
          version: 1,
          actions: [entry],
        };

        const result = CellSchema.Descriptor.validate(descriptor);
        expect(result.ok).to.eql(false);
        expect(result.errors.some((e) => e.kind === 'schema')).to.eql(true);
      });
    });

    it('rejects inline executable step fields', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        actions: [
          action('pull:view'),
          {
            name: 'sample:deploy',
            steps: [{ action: 'pull:view', from: './-actions/pull.view.ts' }],
          },
        ],
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.eql(false);
      expect(result.errors.some((e) => e.kind === 'schema')).to.eql(true);
    });

    it('rejects missing step action refs', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        actions: [compositeAction('sample:deploy', ['pull:view'])],
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.eql(false);
      expect(result.errors).to.deep.include({
        kind: 'semantic',
        path: '/actions/0/steps/0/action',
        message: 'Unknown action reference: pull:view',
      });
    });

    it('rejects action cycles', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        actions: [
          compositeAction('sample:deploy', ['deploy:stage']),
          compositeAction('deploy:stage', ['sample:deploy']),
        ],
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.eql(false);
      expect(result.errors).to.deep.include({
        kind: 'semantic',
        path: '/actions/1/steps/0/action',
        message: 'Action cycle detected: sample:deploy -> deploy:stage -> sample:deploy',
      });
    });

    it('rejects non-relative action config paths', () => {
      const descriptor: unknown = {
        kind: 'cell',
        version: 1,
        actions: [action('pull:view', { config: '-config/@sys.tools.pull/view.yaml' })],
      };

      const result = CellSchema.Descriptor.validate(descriptor);
      expect(result.ok).to.eql(false);
      expect(result.errors.filter((e) => e.kind === 'schema').length).to.be.greaterThan(0);
    });

    it('rejects unknown action and step fields', () => {
      const withUnknownAction: unknown = {
        kind: 'cell',
        version: 1,
        actions: [{ ...action('pull:view'), kind: 'pull' }],
      };
      const withUnknownStep: unknown = {
        kind: 'cell',
        version: 1,
        actions: [
          action('pull:view'),
          { name: 'sample:deploy', steps: [{ action: 'pull:view', label: 'Pull view' }] },
        ],
      };

      const actionResult = CellSchema.Descriptor.validate(withUnknownAction);
      const stepResult = CellSchema.Descriptor.validate(withUnknownStep);
      expect(actionResult.ok).to.eql(false);
      expect(stepResult.ok).to.eql(false);
      expect(actionResult.errors.some((e) => e.kind === 'schema')).to.eql(true);
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

function action(
  name: string,
  overrides: Partial<t.Cell.Action.Leaf> = {},
): t.Cell.Action.Leaf {
  return {
    name,
    from: './-actions/pull.view.ts',
    export: 'PullViewAction',
    config: './-config/@sys.tools.pull/view.yaml',
    ...overrides,
  };
}

function configlessAction(name: string): t.Cell.Action.Leaf {
  return {
    name,
    from: './-actions/clean.tmp.ts',
    export: 'CleanTmpAction',
  };
}

function compositeAction(name: string, actions: readonly string[]): t.Cell.Action.Composite {
  return {
    name,
    steps: actions.map((action) => ({ action })),
  };
}
