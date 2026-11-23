import { describe, expect, expectError, Fs, it, Json, Time, Try } from '../../-test.ts';
import { CellSession } from '../../m.cli/u/u.session.ts';
import { Cell } from '../mod.ts';
import { type StripeSample, withStripeSample } from './u.fixture.sample.stripe.ts';
import { Controlled } from './u.service.fixture.ts';

type Upstream = (typeof upstreams)[number];

const proxy = 'cell:proxy';
const fixturePath = '/-/stripe/payment-intent';
const upstreams = [
  { name: 'ui:static:views', port: 'view', path: '/' },
  { name: 'stripe:dev:fixture', port: 'fixture', path: fixturePath },
] as const;

describe('Stripe sample startup', () => {
  it('CLI starts the sample → both upstreams respond on the configured proxy port', () =>
    withStripeSample(async (sample) => {
      await proveCli(sample);
      await sample.assertFree(...Object.values(sample.ports));
    }));

  for (const [blocked, sibling] of [upstreams, [upstreams[1], upstreams[0]]] as const) {
    for (const keepEdge of [true, false]) {
      const expectation = keepEdge ? 'blocks the proxy' : 'sends the marked GET to the occupant';
      it(`${blocked.name} held before bind → ${expectation}`, () =>
        withStripeSample((sample) => proveCollision(sample, blocked, sibling, keepEdge)));
    }
  }
});

/**
 * Helpers:
 */
async function proveCli({ cwd, root, hostname, ports }: StripeSample) {
  const dir = Fs.join(cwd, 'runtime');
  const config = Fs.Path.fromFileUrl(new URL('../../../deno.json', import.meta.url));
  const denoDir = Deno.env.get('DENO_DIR');
  // Same CLI and reporter as sample:stripe, but point at the copied sample outside the checkout.
  const child = new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--config',
      config,
      '-P=sample',
      '--cached-only',
      '--frozen',
      '--no-prompt',
      `--allow-net=${hostname}`,
      '@sys/cell',
      'start',
      './-sample/cell.stripe',
      '--reporter',
      'auto',
    ],
    cwd,
    clearEnv: true,
    env: { [CellSession.D.env]: dir, ...(denoDir && { DENO_DIR: denoDir }) },
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  const output = Promise.all([child.stdout.text(), child.stderr.text()]);
  let status: Deno.CommandStatus | undefined;
  const done = child.status.then((result) => status = result);
  try {
    await Time.waitFor(async () => {
      if (status) throw new Error(`Sample CLI exited before ready:\n${(await output).join('\n')}`);
      return (await CellSession.list(root, { dir })).some(({ state }) => state === 'ready');
    }, { timeout: 15_000 });

    const page = await request(hostname, ports.proxy, '/');
    expect(await page.text()).to.contain('Hello, Cell');
    expect(page.status).to.eql(200);
    const fixture = await request(hostname, ports.proxy, fixturePath);
    expect(await fixture.json()).to.eql({ error: 'Method not allowed.' });
    expect(fixture.status).to.eql(405);
    expect(fixture.headers.get('allow')).to.eql('POST');
  } finally {
    try {
      if (!status) child.kill('SIGINT');
      await Time.waitFor(() => status, { timeout: 5_000 });
    } finally {
      try {
        if (!status) child.kill('SIGKILL');
      } finally {
        await done;
        await output;
      }
    }
  }
  expect(status?.code).to.eql(130);
}

async function proveCollision(
  { root, hostname, ports, assertFree }: StripeSample,
  blocked: Upstream,
  sibling: Upstream,
  keepEdge: boolean,
) {
  const cell = await Cell.load(root);
  const verified = await Cell.Services.verify(cell);
  const shim = './u.controlled.ts';
  const module = import.meta.resolve('./u.service.fixture.ts');
  await Fs.write(Fs.join(cell.root, shim), `export { Controlled } from ${Json.stringify(module)};`);
  cell.descriptor.services = cell.descriptor.services!.map((service) => ({
    ...service,
    from: shim,
    use: 'Controlled',
    ...(service.name === proxy && !keepEdge && {
      startAfter: service.startAfter?.filter((name) => name !== blocked.name),
    }),
  }));

  const entered = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const siblingBound = Promise.withResolvers<void>();
  const proxyBound = Promise.withResolvers<void>();
  let proxyStarts = 0;
  Controlled.start = async (args) => {
    const service = verified.services.find(({ paths }) => paths.config === args.paths.config);
    if (!service) throw new Error(`Unknown fixture config: ${args.paths.config}`);
    const { name } = service.service;
    if (name === blocked.name) {
      entered.resolve();
      await release.promise;
    }
    if (name === proxy) proxyStarts++;
    const handle = await service.endpoint.start(args);
    if (name === sibling.name) siblingBound.resolve();
    if (name === proxy) proxyBound.resolve();
    return handle;
  };

  const marker = 'stripe-startup-proof';
  const forwarded: string[] = [];
  const port = ports[blocked.port];
  const occupant = Deno.serve({ hostname, port, onListen: () => {} }, (req) => {
    forwarded.push(new URL(req.url).search);
    return new Response(marker);
  });
  const until = new AbortController();
  const outcome = Try.run(() => Cell.Services.start(cell, { until: until.signal }));
  try {
    const beforeRelease = [entered.promise, siblingBound.promise];
    if (!keepEdge) beforeRelease.push(proxyBound.promise);
    await Promise.race([
      Promise.all(beforeRelease),
      outcome.then(({ result }) => {
        throw result.ok ? new Error('Startup completed during the hold') : result.error;
      }),
    ]);
    const markedPath = `${blocked.path}?proof=${marker}`;
    if (keepEdge) {
      const error = await expectError(async () => {
        const res = await request(hostname, ports.proxy, markedPath);
        await res.body?.cancel();
      });
      expect(error).to.be.instanceOf(TypeError);
      expect(proxyStarts, 'proxy starts during the hold').to.eql(0);
      await assertFree(ports.proxy);
    } else {
      const res = await request(hostname, ports.proxy, markedPath);
      expect(await res.text()).to.eql(marker);
      expect(res.status).to.eql(200);
    }
    release.resolve();

    const { result } = await outcome;
    if (result.ok) {
      throw new Error('Expected startup to fail with the held upstream bind conflict');
    }
    expect(result.error.message).to.include(`failed to start service '${blocked.name}'`);
    expect(result.error.cause).to.be.instanceOf(Deno.errors.AddrInUse);
    expect(proxyStarts).to.eql(keepEdge ? 0 : 1);
    expect(forwarded).to.eql(keepEdge ? [] : [`?proof=${marker}`]);
    await assertFree(ports[sibling.port], ports.proxy);
  } finally {
    until.abort();
    release.resolve();
    const { result } = await outcome;
    try {
      if (result.ok) await result.data.close();
    } finally {
      await occupant.shutdown();
    }
  }
}

function request(hostname: string, port: number, path: string) {
  return fetch(`http://${hostname}:${port}${path}`, {
    redirect: 'error',
    signal: AbortSignal.timeout(2_000),
  });
}
