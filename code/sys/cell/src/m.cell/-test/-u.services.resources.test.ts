import { describe, expect, Fs, it, Str } from '../../-test.ts';
import { Cell } from '../mod.ts';
import { tempCell } from './u.fixture.ts';
import {
  resetServiceEvents,
  serviceEvents,
  ServiceEndpointFixture,
} from './u.service.fixture.ts';

describe('Cell.Services.resources', () => {
  it('asks owner endpoints for declared resources without starting services', async () => {
    resetServiceEvents();
    const from = ServiceEndpointFixture.declaredResources();
    const root = await tempCell('services-resources-declared', descriptor({
      use: 'Resourceful',
      from,
    }));
    const cell = await Cell.load(root);

    const plan = await Cell.Services.resources(cell, { trusted: ['data:'] });

    expect(plan.root).to.eql(root);
    expect(plan.mode).to.eql('default');
    expect(plan.resources.map((item) => item.resource)).to.eql([
      { kind: 'tcp-listener', host: '127.0.0.1', port: 5050 },
    ]);
    expect(plan.resources[0].service.name).to.eql('view');
    expect(serviceEvents()).to.eql([
      `resources:${root}:${Fs.join(root, '-config/service.yaml')}`,
    ]);
  });

  it('rejects invalid resource declarations before mutation callers can act', async () => {
    const from = ServiceEndpointFixture.invalidResources();
    const root = await tempCell('services-resources-invalid', descriptor({
      use: 'InvalidResource',
      from,
    }));
    const cell = await Cell.load(root);

    const error = await catchResources(cell, { trusted: ['data:'] });

    expect(error?.message).to.eql(
      "Cell.Services.resources: service 'view' declared invalid resource: resource 0 has invalid tcp port: 0.",
    );
  });

  it('does not scrape config for services without resource hooks', async () => {
    resetServiceEvents();
    const from = ServiceEndpointFixture.noResources();
    const root = await tempCell('services-resources-no-hook', descriptor({
      use: 'Plain',
      from,
      config: './-config/missing.yaml',
    }));
    const cell = await Cell.load(root);

    const plan = await Cell.Services.resources(cell, { trusted: ['data:'] });

    expect(plan.resources).to.eql([]);
    expect(serviceEvents()).to.eql([]);
  });
});

async function catchResources(
  cell: Awaited<ReturnType<typeof Cell.load>>,
  options: Parameters<typeof Cell.Services.resources>[1],
): Promise<Error | undefined> {
  try {
    await Cell.Services.resources(cell, options);
  } catch (err) {
    return err as Error;
  }
}

function descriptor(overrides: Partial<{ use: string; from: string; config: string }> = {}) {
  return Str.dedent(`
    kind: cell
    version: 1

    services:
      - name: view
        use: ${overrides.use ?? 'Service'}
        from: '${overrides.from ?? './service.ts'}'
        config: ${overrides.config ?? './-config/service.yaml'}
  `).trimStart();
}
