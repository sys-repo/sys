import { describe, expect, Fs, it, Str, type t } from '../../-test.ts';
import { Cell } from '../mod.ts';
import { tempCell } from './u.fixture.ts';

describe('Cell.Services.plan', () => {
  it('plans default service bindings without importing endpoints', async () => {
    const root = await tempCell('services-plan-default', descriptor());
    const cell = await Cell.load(root);

    const plan = await Cell.Services.plan(cell);
    const service = plan.services[0];

    expect(plan.root).to.eql(root);
    expect(plan.mode).to.eql('default');
    expect(plan.services.length).to.eql(1);
    expect(service.service).to.eql({
      name: 'view',
      use: 'Serve',
      from: './-services/static.ts',
      config: './-config/static.yaml',
    });
    expect(service.selection.mode).to.eql('default');
    expect(service.selection.variant).to.eql(undefined);
    expect(service.selection.descriptor.from).to.eql('./-services/static.ts');
    expect(service.selection.binding).to.eql({
      use: 'Serve',
      from: './-services/static.ts',
      config: './-config/static.yaml',
    });
    expect(service.paths.config).to.eql(Fs.join(root, '-config/static.yaml'));
    expect(service.endpoint).to.include({
      use: 'Serve',
      from: './-services/static.ts',
      source: 'local',
    });
    expect(service.endpoint.specifier).to.contain('/-services/static.ts');
  });

  it('selects matching mode variants while preserving one service identity', async () => {
    const root = await tempCell('services-plan-dev-mode', twoServiceDescriptor());
    const cell = await Cell.load(root);

    const plan = await Cell.Services.plan(cell, { mode: 'dev' });
    const [view, api] = plan.services;

    expect(plan.mode).to.eql('dev');
    expect(plan.services.map((item) => item.service.name)).to.eql(['view', 'api']);
    expect(view.service).to.eql({
      name: 'view',
      use: 'DevService',
      from: './-services/view.dev.ts',
      config: './-config/view.dev.yaml',
    });
    expect(view.selection).to.include({ name: 'view', mode: 'dev', variant: 'dev' });
    expect(view.selection.descriptor.from).to.eql('./-services/static.ts');
    expect(view.selection.binding).to.eql({
      use: 'DevService',
      from: './-services/view.dev.ts',
      config: './-config/view.dev.yaml',
    });
    expect(view.paths.config).to.eql(Fs.join(root, '-config/view.dev.yaml'));
    expect(view.endpoint).to.include({
      use: 'DevService',
      from: './-services/view.dev.ts',
      source: 'local',
    });

    expect(api.service).to.eql({
      name: 'api',
      use: 'ApiService',
      from: './-services/api.ts',
      config: './-config/api.yaml',
    });
    expect(api.selection.mode).to.eql('dev');
    expect(api.selection.variant).to.eql(undefined);
    expect(api.selection.binding).to.eql({
      use: 'ApiService',
      from: './-services/api.ts',
      config: './-config/api.yaml',
    });
  });

  it('treats explicit default mode as base bindings', async () => {
    const root = await tempCell('services-plan-explicit-default', descriptor());
    const cell = await Cell.load(root);

    const plan = await Cell.Services.plan(cell, { mode: 'default' });

    expect(plan.mode).to.eql('default');
    expect(plan.services[0].service.from).to.eql('./-services/static.ts');
    expect(plan.services[0].selection.variant).to.eql(undefined);
  });

  it('accepts config paths that start with dot-dot inside the Cell root', async () => {
    const root = await tempCell(
      'services-plan-dotcache-config',
      descriptor({ baseConfig: './..cache/@sys.http/static.view.yaml' }),
    );
    const plan = await Cell.Services.plan(await Cell.load(root));

    expect(plan.services[0].paths.config).to.eql(Fs.join(root, '..cache/@sys.http/static.view.yaml'));
  });

  it('fails clearly for invalid or unknown service modes', async () => {
    const root = await tempCell('services-plan-mode-errors', descriptor());
    const cell = await Cell.load(root);

    const blank = await catchPlan(cell, { mode: '' as t.Cell.Services.ServiceMode });
    const invalid = await catchPlan(cell, { mode: 'Bad' as t.Cell.Services.ServiceMode });
    const unknown = await catchPlan(cell, { mode: 'staging' });

    expect(blank?.message).to.eql("Cell.Services.plan: invalid service mode ''.");
    expect(invalid?.message).to.eql("Cell.Services.plan: invalid service mode 'Bad'.");
    expect(unknown?.message).to.eql("Cell.Services.plan: unknown service mode 'staging'.");
  });

  it('reports unknown mode before resolving fallback base bindings', async () => {
    const root = await tempCell(
      'services-plan-unknown-mode-before-base-resolution',
      descriptor({ baseFrom: 'npm:untrusted-base' }),
    );
    const cell = await Cell.load(root);

    const error = await catchPlan(cell, { mode: 'staging' });

    expect(error?.message).to.eql("Cell.Services.plan: unknown service mode 'staging'.");
  });

  it('resolves selected JSR variant refs through the shared endpoint resolver', async () => {
    const root = await tempCell(
      'services-plan-jsr-variant',
      descriptor({ variantFrom: 'jsr:@sys/tools/serve', variantUse: 'Serve' }),
    );
    const cell = await Cell.load(root);

    const plan = await Cell.Services.plan(cell, { mode: 'dev' });
    const service = plan.services[0];

    expect(service.service.from).to.eql('jsr:@sys/tools/serve');
    expect(service.endpoint).to.include({
      use: 'Serve',
      from: 'jsr:@sys/tools/serve',
      source: 'trusted',
    });
    expect(service.endpoint.specifier).to.contain('sys.tools');
  });

  it('rejects selected variant refs and configs that escape the Cell root', async () => {
    const escapingImportRoot = await tempCell(
      'services-plan-escaping-import',
      descriptor({ variantFrom: './../service.ts' }),
    );
    const escapingConfigRoot = await tempCell(
      'services-plan-escaping-config',
      descriptor({ variantConfig: './../outside.yaml' }),
    );

    const importError = await catchPlan(await Cell.load(escapingImportRoot), { mode: 'dev' });
    const configError = await catchPlan(await Cell.load(escapingConfigRoot), { mode: 'dev' });

    expect(importError?.message).to.eql(
      "Cell.Services.plan: local service import for 'view' escapes Cell root: ./../service.ts",
    );
    expect(configError?.message).to.eql(
      'Cell.Services.plan: config escapes Cell root: ./../outside.yaml',
    );
  });
});

async function catchPlan(
  cell: Awaited<ReturnType<typeof Cell.load>>,
  options: t.Cell.Services.PlanOptions,
): Promise<Error | undefined> {
  try {
    await Cell.Services.plan(cell, options);
  } catch (err) {
    return err as Error;
  }
}

type DescriptorOptions = Partial<{
  baseFrom: string;
  baseConfig: string;
  variantUse: string;
  variantFrom: string;
  variantConfig: string;
}>;

function descriptor(options: DescriptorOptions = {}) {
  return Str.dedent(`
    kind: cell
    version: 1

    services:
      - name: view
        use: Serve
        from: '${options.baseFrom ?? './-services/static.ts'}'
        config: ${options.baseConfig ?? './-config/static.yaml'}
        variants:
          dev:
            use: ${options.variantUse ?? 'DevService'}
            from: '${options.variantFrom ?? './-services/view.dev.ts'}'
            config: ${options.variantConfig ?? './-config/view.dev.yaml'}
  `).trimStart();
}

function twoServiceDescriptor() {
  return Str.dedent(`
    kind: cell
    version: 1

    services:
      - name: view
        use: Serve
        from: './-services/static.ts'
        config: ./-config/static.yaml
        variants:
          dev:
            use: DevService
            from: './-services/view.dev.ts'
            config: ./-config/view.dev.yaml
      - name: api
        use: ApiService
        from: './-services/api.ts'
        config: ./-config/api.yaml
  `).trimStart();
}
