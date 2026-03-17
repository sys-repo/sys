import { describe, expect, Fs, it } from '../../../-test.ts';
import { DenoEntry } from '../mod.ts';
import { createServeWorkspace } from './u.fixture.ts';

describe(`DenoEntry.serve`, () => {
  it('serves target dist index.html and emitted js from cwd + targetDir', async () => {
    const fixture = await createServeWorkspace();

    const app = await DenoEntry.serve({
      cwd: fixture.fs.dir,
      targetDir: fixture.targetDir,
    });

    const res = await app.fetch(new Request('http://local/'));
    const body = await res.text();
    expect(res.status).to.eql(200);
    expect(res.headers.get('content-type')).to.contain('text/html');
    expect(res.headers.get('pkg-digest')).to.eql(fixture.hash);
    expect(body).to.contain(fixture.assetPath);

    const assetRes = await app.fetch(new Request(`http://local${fixture.assetPath}`));
    expect(assetRes.status).to.eql(200);
    expect(assetRes.headers.get('content-type')).to.contain('javascript');
    await assetRes.text();
  });

  it('returns 404 for missing asset-like paths', async () => {
    const fixture = await createServeWorkspace();

    const app = await DenoEntry.serve({
      cwd: fixture.fs.dir,
      targetDir: fixture.targetDir,
    });

    const res = await app.fetch(new Request('http://local/pkg/missing.js'));
    expect(res.status).to.eql(404);
    expect(await res.text()).to.eql('Not Found');
  });

  it('falls back to index.html for non-asset routes', async () => {
    const fixture = await createServeWorkspace();

    const app = await DenoEntry.serve({
      cwd: fixture.fs.dir,
      targetDir: fixture.targetDir,
    });

    const res = await app.fetch(new Request('http://local/dashboard'));
    expect(res.status).to.eql(200);
    expect(res.headers.get('content-type')).to.contain('text/html');
    expect(await res.text()).to.eql(fixture.html);
  });

  it('returns 500 when dist index.html is missing', async () => {
    const fixture = await createServeWorkspace({ withIndexHtml: false });

    const app = await DenoEntry.serve({
      cwd: fixture.fs.dir,
      targetDir: fixture.targetDir,
    });

    const res = await app.fetch(new Request('http://local/dashboard'));
    expect(res.status).to.eql(500);
    expect(await res.text()).to.contain('Missing dist index.html');
  });

  it('serves from distDir override when provided', async () => {
    const fixture = await createServeWorkspace({
      assetCode: `console.info('override');\n`,
      assetName: 'override.js',
      distDir: 'my-build',
    });

    const app = await DenoEntry.serve({
      cwd: fixture.fs.dir,
      distDir: fixture.distDir,
      targetDir: fixture.targetDir,
    });

    const res = await app.fetch(new Request('http://local/'));
    const body = await res.text();
    expect(res.status).to.eql(200);
    expect(body).to.contain(fixture.assetPath);
  });

  it('rejects targetDir values that escape cwd', async () => {
    const fixture = await createServeWorkspace();

    let err: unknown;
    try {
      await DenoEntry.serve({
        cwd: fixture.fs.dir,
        targetDir: '../escape',
      });
    } catch (error) {
      err = error;
    }

    expect(err).to.be.instanceOf(Error);
    expect((err as Error).message).to.contain(`DenoEntry.serve: 'targetDir' escapes root`);
  });

  it('rejects tampered dist artifacts at startup', async () => {
    const fixture = await createServeWorkspace();
    await Fs.write(
      fixture.fs.join('code/projects/foo/dist/pkg/app.js'),
      `console.info('tampered');\n`,
    );

    let err: unknown;
    try {
      await DenoEntry.serve({
        cwd: fixture.fs.dir,
        targetDir: fixture.targetDir,
      });
    } catch (error) {
      err = error;
    }

    expect(err).to.be.instanceOf(Error);
    expect((err as Error).message).to.contain('invalid dist artifact');
  });
});
