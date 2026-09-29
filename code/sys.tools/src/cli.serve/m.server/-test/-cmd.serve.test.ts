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

  it('startServer: closes from external lifecycle input', async () => {
    const dir = await Fixture.makeTempDir('serve-start-until');
    await Fixture.writeFile(dir, 'index.html', '<!doctype html><h1>until</h1>');

    const abort = new AbortController();
    const context = await startServer(
      { name: 'Test Site', dir },
      { host: 'local', silent: true, until: abort.signal },
    );

    try {
      abort.abort('test.until');
      await Fixture.expectFinishedSoon(context.server.finished);
      await context.close('test.after-until');
    } finally {
      abort.abort('test.cleanup');
      await context.close('test.cleanup');
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

const sampleDist = () =>
  Fixture.distDoc({
    builtAt: 1746520471244,
    indexHtml: '<!doctype html><h1>view</h1>',
  });
