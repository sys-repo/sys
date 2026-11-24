import { create, start } from '@sys/http/server/host';
import type { HttpProxy } from '@sys/http/t';
import { expect, Fs, type t, Testing, Yaml } from '../../-test.ts';
import { sampleRoot } from './u.fixture.ts';

type Ports = { readonly view: number; readonly fixture: number; readonly proxy: number };
export type StripeSample = {
  readonly cwd: t.StringDir;
  readonly root: t.StringDir;
  readonly hostname: string;
  readonly ports: Ports;
  assertFree(...ports: number[]): Promise<void>;
};

const hostname = '127.0.0.1';
const shipped: Ports = { view: 4040, fixture: 9090, proxy: 8080 };

/** Copy and validate the shipped sample before choosing any runtime ports. */
export function withStripeSample(run: (sample: StripeSample) => Promise<void>) {
  return Testing.withTmpDir(async (cwd) => {
    const root = Fs.join(cwd, '-sample/cell.stripe');
    const writeConfigs = await prepareSample(root);
    const fixed = Deno.args.includes('--fixed');
    let ports: Ports;
    {
      // Keep all three binds live so the OS cannot assign the same port twice.
      await using view = bind(fixed ? shipped.view : 0);
      await using fixture = bind(fixed ? shipped.fixture : 0);
      await using proxy = bind(fixed ? shipped.proxy : 0);
      ports = { view: view.port, fixture: fixture.port, proxy: proxy.port };
      if (fixed) expect(ports).to.eql(shipped);
      await writeConfigs(ports);
    }
    await run({ cwd, root, hostname, ports, assertFree });
  });
}

/**
 * Helpers:
 */
function bind(port: number) {
  return start(create(), { hostname, port, strictPort: true, silent: true });
}

async function assertFree(...ports: number[]) {
  for (const port of ports) {
    await using server = bind(port);
    expect(server.port, 'exact loopback rebind').to.eql(port);
  }
}

async function prepareSample(root: t.StringDir) {
  for (const path of ['-config/@sys.cell/cell.yaml', 'view/hello-world/index.html']) {
    await Fs.copyFile(Fs.join(sampleRoot(), path), Fs.join(root, path), { throw: true });
  }
  const dotenv = await Fs.findAncestor(root, async ({ dir }) => {
    const path = Fs.join(dir, '.env');
    return await Fs.lstat(path) ? path : undefined;
  });
  if (dotenv) throw new Error(`Stripe sample proof requires no ancestor .env: ${dotenv}`);

  const viewPath = '-config/@sys.http/static.view.yaml';
  const fixturePath = '-config/@sys.driver-stripe/fixture.yaml';
  const proxyPath = '-config/@sys.http/proxy.yaml';
  const view = await readListener(viewPath, shipped.view);
  const fixture = await readListener(fixturePath, shipped.fixture);
  const front = await readListener<HttpProxy.Config.Doc>(proxyPath, shipped.proxy);
  const viewOrigin = `http://${hostname}:${shipped.view}`;
  const fixtureOrigin = `http://${hostname}:${shipped.fixture}`;
  expect(front.root?.target, 'proxy root').to.eql(`${viewOrigin}/hello-world/`);
  expect(front.mounts, 'proxy mounts').to.have.deep.members([
    { path: '/payments/', target: `${viewOrigin}/.pulled/driver.stripe/` },
    { path: '/view/', target: `${viewOrigin}/` },
    { path: '/-/stripe/', target: `${fixtureOrigin}/-/stripe/` },
  ]);
  expect(front.exactRoutes ?? [], 'unexpected exact routes').to.eql([]);

  return async (ports: Ports) => {
    const remap = (target: string) => {
      const url = new URL(target);
      // Only these two origins passed the topology assertions above.
      url.port = String(url.origin === viewOrigin ? ports.view : ports.fixture);
      return url.href;
    };
    await writeConfig(viewPath, { ...view, port: ports.view });
    await writeConfig(fixturePath, { ...fixture, port: ports.fixture });
    await writeConfig(proxyPath, {
      ...front,
      port: ports.proxy,
      root: { ...front.root, target: remap(front.root!.target) },
      mounts: front.mounts.map((mount) => ({ ...mount, target: remap(mount.target) })),
    });
  };

  async function readListener<T extends object = Record<string, unknown>>(
    path: string,
    port: number,
  ) {
    const result = await Fs.readYaml<T>(Fs.join(sampleRoot(), path));
    if (!result.ok || !result.data) throw new Error(`Cannot read ${path}`, { cause: result.error });
    expect(result.data, path).to.include({ hostname, port, strictPort: true });
    return result.data;
  }

  async function writeConfig(path: string, doc: object) {
    const yaml = Yaml.stringify(doc);
    if (yaml.error) throw yaml.error;
    await Fs.write(Fs.join(root, path), yaml.data);
  }
}
