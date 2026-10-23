import { HttpServer } from '@sys/http/server';
import { fixtureEnv, fixtureInputs } from '../../src/-test/u.fixture.ts';
import { startWith } from '../service.ts';
import { describe, expect, expectError, Fs, it, pkg, type t } from './common.ts';
import { shellFixture } from './u.fixture.status.ts';

const STARTED = new Error('inert HTTP start reached');

describe('R2 deployment sample: service endpoint', () => {
  it('different config path → refusal before bootstrap IO', async () => {
    const deps = inertDependencies();
    let reads = 0;
    deps.readInputs = () => {
      reads += 1;
      throw new Error('bootstrap must not run');
    };
    for (const config of ['./other.json', './nested/r2.config.json']) {
      await expectError(
        () => startWith({ cwd: '/sample', paths: { config } }, deps),
        'Sample service requires the root r2.config.json.',
      );
    }
    expect(reads).to.eql(0);
  });

  it('selected root → ordered bootstrap, fixed listener policy, and owner presentation', async () => {
    await using f = await shellFixture();
    const inputs = f.inputs;
    const deps = inertDependencies();
    const order: string[] = [];
    const stopping = new AbortController();
    const app = HttpServer.create();
    deps.readInputs = (root) => {
      order.push('inputs');
      expect(root).to.eql(f.dir.absolute);
      return Promise.resolve(inputs);
    };
    deps.loadEnv = (root) => {
      order.push('environment');
      expect(root).to.eql(f.dir.absolute);
      return Promise.resolve(fixtureEnv);
    };
    deps.appFrom = (selected, env) => {
      order.push('app');
      expect(selected).to.equal(inputs);
      expect(env).to.equal(fixtureEnv);
      return Promise.resolve(app);
    };
    deps.start = (startedApp, options) => {
      order.push('listener');
      expect(startedApp).to.equal(app);
      expect(options).to.include({
        name: pkg.name,
        hostname: '127.0.0.1',
        port: 8080,
        strictPort: true,
        keyboard: false,
        silent: true,
        until: stopping.signal,
      });
      expect(options?.status?.urlPaths).to.eql(['/', '/ui/', '/ui/dist.json', '/api/hello']);
      const detail = options?.status?.details?.[0];
      if (!detail || !options?.formatDetail) {
        throw new Error('Expected verified shell presentation.');
      }
      expect(detail.label).to.eql('shell');
      expect(options.status?.details).to.have.length(1);
      const rich = options.formatDetail({ detail });
      const manifest = Fs.Path.toFileUrl(f.dir.join('dist.private/dist.json'));
      expect(rich).to.include(manifest.href);
      expect(rich).to.include(new URL('./', manifest).href);
      throw STARTED;
    };
    const args: t.SampleServiceArgs = {
      cwd: f.dir.absolute,
      paths: { config: './nested/../r2.config.json' },
      silent: true,
      until: stopping.signal,
    };
    expect(await expectError(() => startWith(args, deps))).to.equal(STARTED);
    expect(order).to.eql(['inputs', 'environment', 'app', 'listener']);
  });

  for (const stage of ['readInputs', 'loadEnv', 'appFrom'] as const) {
    it(`${stage} failure → exact cause survives without starting a listener`, async () => {
      const cause = new Error(`${stage} failed`);
      const deps = inertDependencies();
      let starts = 0;
      deps[stage] = () => {
        throw cause;
      };
      deps.start = () => {
        starts += 1;
        throw STARTED;
      };
      const args = { cwd: '/sample', paths: { config: '/sample/r2.config.json' } };
      expect(await expectError(() => startWith(args, deps))).to.equal(cause);
      expect(starts).to.eql(0);
    });
  }
});

/** No environment lookup, provider request, or listener is possible through these dependencies. */
function inertDependencies(): t.SampleServiceDependencies {
  return {
    readInputs: () => Promise.resolve(fixtureInputs()),
    loadEnv: () => Promise.resolve(fixtureEnv),
    appFrom: () => Promise.resolve(HttpServer.create()),
    start() {
      throw STARTED;
    },
  };
}
