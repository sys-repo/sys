import { describe, expect, Fs, Is, it, Str } from '../../-test.ts';
import { Cell } from '../mod.ts';
import { sampleRoot, tempCell } from './u.fixture.ts';

describe('Cell.Runtime.check', () => {
  it('checks runtime service endpoints for the Stripe sample', async () => {
    const cell = await Cell.load(sampleRoot());
    const check = await Cell.Runtime.check(cell);

    expect(check.services.map((service) => service.service.name)).to.eql(['view', 'stripe']);
    expect(check.services.map((service) => service.service.kind)).to.eql([
      'http-static',
      'http-server',
    ]);
    expect(check.services.every((service) => Is.func(service.endpoint.start))).to.eql(true);
    expect(check.services[0].paths.config).to.eql(
      Fs.join(cell.root, '-config/@sys.http/static.view.yaml'),
    );
  });

  it('fails clearly when service config is missing', async () => {
    const root = await tempCell(
      'runtime-missing-config',
      descriptor({ config: './-config/missing.yaml' }),
    );
    const cell = await Cell.load(root);
    const error = await catchCheck(cell);

    expect(error?.message).to.contain("Cell.Runtime.check: failed to read config for 'view':");
    expect(error?.message).to.contain('-config/missing.yaml');
  });

  it('fails clearly when service config YAML is invalid', async () => {
    const root = await tempCell('runtime-invalid-config-yaml', descriptor());
    await Fs.write(Fs.join(root, '-config/@sys.http/static.view.yaml'), `dir: .:\n`, {
      force: true,
    });
    const cell = await Cell.load(root);
    const error = await catchCheck(cell);

    expect(error?.message).to.contain(
      "Cell.Runtime.check: failed to parse config YAML for 'view':",
    );
    expect(error?.message).to.contain('-config/@sys.http/static.view.yaml');
  });

  it('fails clearly when service config is not an object', async () => {
    const root = await tempCell('runtime-config-not-object', descriptor());
    await Fs.write(Fs.join(root, '-config/@sys.http/static.view.yaml'), `- bad\n`, { force: true });
    const cell = await Cell.load(root);
    const error = await catchCheck(cell);

    expect(error?.message).to.contain(
      "Cell.Runtime.check: config for 'view' must be a YAML object:",
    );
    expect(error?.message).to.contain('-config/@sys.http/static.view.yaml');
  });

  it('fails clearly when trusted service import cannot resolve', async () => {
    const root = await tempCell(
      'runtime-missing-module',
      descriptor({ from: '@sys/cell/missing-runtime' }),
    );
    await writeStaticConfig(root);
    const cell = await Cell.load(root);
    const error = await catchCheck(cell);

    expect(error?.message).to.eql(
      "Cell.Runtime.check: failed to import runtime service for 'view': @sys/cell/missing-runtime",
    );
  });

  it('fails clearly when service import is untrusted', async () => {
    const root = await tempCell('runtime-untrusted', descriptor({ from: 'npm:fake-package' }));
    const cell = await Cell.load(root);
    const error = await catchCheck(cell);

    expect(error?.message).to.eql(
      "Cell.Runtime.check: untrusted runtime service import for 'view': npm:fake-package",
    );
  });

  it('fails clearly when service export is missing', async () => {
    const root = await tempCell('runtime-missing-export', descriptor({ export: 'MissingExport' }));
    await writeStaticConfig(root);
    const cell = await Cell.load(root);
    const error = await catchCheck(cell);

    expect(error?.message).to.eql(
      "Cell.Runtime.check: '@sys/http/server/static' export 'MissingExport' must expose start(...) for service 'view'.",
    );
  });

  it('fails clearly when service export has no start function', async () => {
    const root = await tempCell(
      'runtime-export-without-start',
      descriptor({ from: '@sys/cell', export: 'Cell' }),
    );
    await writeStaticConfig(root);
    const cell = await Cell.load(root);
    const error = await catchCheck(cell);

    expect(error?.message).to.eql(
      "Cell.Runtime.check: '@sys/cell' export 'Cell' must expose start(...) for service 'view'.",
    );
  });
});

async function catchCheck(cell: Awaited<ReturnType<typeof Cell.load>>): Promise<Error | undefined> {
  try {
    await Cell.Runtime.check(cell);
  } catch (err) {
    return err as Error;
  }
}

async function writeStaticConfig(root: string) {
  await Fs.write(Fs.join(root, '-config/@sys.http/static.view.yaml'), `dir: .\n`, { force: true });
}

function descriptor(overrides: Partial<{ from: string; export: string; config: string }> = {}) {
  const from = overrides.from ?? '@sys/http/server/static';
  const exp = overrides.export ?? 'HttpStatic';
  const config = overrides.config ?? './-config/@sys.http/static.view.yaml';

  return Str.dedent(`
    kind: cell
    version: 1

    dsl:
      root: ./data

    views:
      hello:
        source:
          local: ./view/hello

    runtime:
      services:
        - name: view
          kind: http-static
          for:
            views: [hello]
          from: '${from}'
          export: ${exp}
          config: ${config}
  `).trimStart();
}
