import { describe, expect, Fs, it } from '../../../-test.ts';
import { startServer } from '../mod.ts';
import { Fixture } from '../../-test/u.ts';

describe('serve server lifecycle', () => {
  it('startServer: starts a reusable local server context', async () => {
    const dir = await Fixture.makeTempDir('serve-start');
    await Fixture.writeFile(dir, 'index.html', '<!doctype html><h1>hello</h1>');

    const context = await startServer({ name: 'Test Site', dir }, { host: 'local', silent: true });
    try {
      expect(context.host).to.eql('local');
      expect(context.hostname).to.eql('127.0.0.1');
      expect(context.baseUrl).to.match(/^http:\/\/localhost:\d+$/);

      const res = await fetch(`${context.baseUrl}/`);
      expect(res.status).to.eql(200);
      expect(await res.text()).to.contain('hello');
    } finally {
      await context.close();
    }
  });

  it('startServer: infers an actionable URL when a single dist view is present', async () => {
    const dir = await Fixture.makeTempDir('serve-start-view');
    await Fixture.writeFile(dir, 'foo/bar/index.html', '<!doctype html><h1>view</h1>');
    await Fs.writeJson(`${dir}/foo/bar/dist.json`, sampleDist());

    const context = await startServer({ name: 'Test Site', dir }, { host: 'local', silent: true });
    try {
      expect(context.url).to.eql(`${context.baseUrl}/foo/bar/`);
    } finally {
      await context.close();
    }
  });
});

const sampleDist = () => ({
  type: 'https://jsr.io/@sample/foo',
  pkg: { name: '@sample/foo', version: '1.0.0' },
  build: {
    time: 1746520471244,
    size: { total: 2, pkg: 2 },
    builder: '@sample/builder@1.0.0',
    runtime: 'deno=2.6.0:v8=14.5.201.2-rusty:typescript=5.9.2',
    hash: { policy: 'https://jsr.io/@sys/fs/0.0.229/src/m.Pkg/m.Pkg.Dist.ts' },
  },
  hash: {
    digest: 'sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18',
    parts: {
      './index.html': 'sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18',
    },
  },
});
