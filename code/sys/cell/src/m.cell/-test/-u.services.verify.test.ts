import { describe, expect, Fs, Is, it, Str } from '../../-test.ts';
import { Cell } from '../mod.ts';
import { sampleRoot, tempCell } from './u.fixture.ts';

describe('Cell.Services.verify', () => {
  it('verifies service endpoints for the Stripe sample', async () => {
    const cell = await Cell.load(sampleRoot());
    const verify = await Cell.Services.verify(cell);

    expect(verify.services.map((service) => service.service.name)).to.eql([
      'ui:static:views',
      'stripe:dev:fixture',
      'cell:proxy',
    ]);
    expect(verify.services.every((service) => Is.func(service.endpoint.start))).to.eql(true);
    expect(verify.services.every((service) => !('config' in service))).to.eql(true);
    expect(verify.services[0].paths.config).to.eql(
      Fs.join(cell.root, '-config/@sys.http/static.view.yaml'),
    );
    expect(verify.services[2].paths.config).to.eql(
      Fs.join(cell.root, '-config/@sys.http/proxy.yaml'),
    );
  });

  it('does not read or parse service config refs', async () => {
    const root = await tempCell('services-config-ref-only', descriptor());
    await Fs.write(Fs.join(root, '-config/@sys.http/static.view.yaml'), `dir: .:\n`, {
      force: true,
    });
    const cell = await Cell.load(root);
    const verified = await Cell.Services.verify(cell);

    expect(verified.services[0].paths.config).to.eql(
      Fs.join(root, '-config/@sys.http/static.view.yaml'),
    );
    expect(verified.services[0]).to.not.have.property('config');
  });

  it('verifies Cell-local service adapters inside the root', async () => {
    const root = await tempCell(
      'services-local-adapter',
      descriptor({ from: './-services/capture.ts', use: 'CaptureService' }),
    );
    await Fs.write(
      Fs.join(root, './-services/capture.ts'),
      `export const CaptureService = { start() { return { close() {} }; } };\n`,
      { force: true },
    );
    const cell = await Cell.load(root);
    const verified = await Cell.Services.verify(cell);

    expect(verified.services[0].service.from).to.eql('./-services/capture.ts');
    expect(Is.func(verified.services[0].endpoint.start)).to.eql(true);
  });

  it('rejects absolute and escaping local service imports', async () => {
    const absoluteRoot = await tempCell(
      'services-absolute-import',
      descriptor({ from: Fs.join(Fs.resolve('.'), 'service.ts') }),
    );
    const escapingRoot = await tempCell(
      'services-escaping-import',
      descriptor({ from: './../service.ts' }),
    );

    const absoluteError = await catchVerify(await Cell.load(absoluteRoot));
    const escapingError = await catchVerify(await Cell.load(escapingRoot));

    expect(absoluteError?.message).to.contain(
      "Cell.Services.verify: absolute service import for 'view' is not allowed:",
    );
    expect(escapingError?.message).to.eql(
      "Cell.Services.verify: local service import for 'view' escapes Cell root: ./../service.ts",
    );
  });

  it('rejects config paths that escape the Cell root', async () => {
    const root = await tempCell(
      'services-config-escapes-root',
      descriptor({ config: './../outside.yaml' }),
    );
    const cell = await Cell.load(root);
    const error = await catchVerify(cell);

    expect(error?.message).to.eql(
      'Cell.Services.verify: config escapes Cell root: ./../outside.yaml',
    );
  });

  it('fails clearly when trusted service import cannot resolve', async () => {
    const root = await tempCell(
      'services-missing-module',
      descriptor({ from: '@sys/cell/missing-services' }),
    );
    await writeStaticConfig(root);
    const cell = await Cell.load(root);
    const error = await catchVerify(cell);

    expect(error?.message).to.eql(
      "Cell.Services.verify: failed to import service for 'view': @sys/cell/missing-services",
    );
  });

  it('fails clearly when service import is untrusted', async () => {
    const root = await tempCell('services-untrusted', descriptor({ from: 'npm:fake-package' }));
    const cell = await Cell.load(root);
    const error = await catchVerify(cell);

    expect(error?.message).to.eql(
      "Cell.Services.verify: untrusted service import for 'view': npm:fake-package",
    );
  });

  it('fails clearly when service use target is missing', async () => {
    const root = await tempCell('services-missing-use', descriptor({ use: 'MissingExport' }));
    await writeStaticConfig(root);
    const cell = await Cell.load(root);
    const error = await catchVerify(cell);

    expect(error?.message).to.eql(
      "Cell.Services.verify: '@sys/http/server/static' use 'MissingExport' must expose start(...) for service 'view'.",
    );
  });

  it('fails clearly when service use target has no start function', async () => {
    const root = await tempCell(
      'services-use-without-start',
      descriptor({ from: '@sys/cell', use: 'pkg' }),
    );
    await writeStaticConfig(root);
    const cell = await Cell.load(root);
    const error = await catchVerify(cell);

    expect(error?.message).to.eql(
      "Cell.Services.verify: '@sys/cell' use 'pkg' must expose start(...) for service 'view'.",
    );
  });
});

async function catchVerify(
  cell: Awaited<ReturnType<typeof Cell.load>>,
): Promise<Error | undefined> {
  try {
    await Cell.Services.verify(cell);
  } catch (err) {
    return err as Error;
  }
}

async function writeStaticConfig(root: string) {
  await Fs.write(Fs.join(root, '-config/@sys.http/static.view.yaml'), `dir: .\n`, { force: true });
}

function descriptor(overrides: Partial<{ from: string; use: string; config: string }> = {}) {
  const from = overrides.from ?? '@sys/http/server/static';
  const use = overrides.use ?? 'HttpStatic';
  const config = overrides.config ?? './-config/@sys.http/static.view.yaml';

  return Str.dedent(`
    kind: cell
    version: 1

    services:
      - name: view
        from: '${from}'
        use: ${use}
        config: ${config}
  `).trimStart();
}
