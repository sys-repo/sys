import { describe, expect, Fs, Is, it, Pkg, Str } from '../../../-test.ts';
import { DenoEntry } from '../mod.ts';
import { createServeWorkspace } from './u.fixture.ts';

describe(`DenoEntry.serve`, () => {
  for (const stage of ['success', 'setup', 'body'] as const) {
    it(`fixture ${stage} → owned workspace removed, failure retained`, async () => {
      const failure = new Error(`Fixture ${stage} failure.`);
      let path: string | undefined;
      let caught: unknown;
      try {
        await using fixture = await createServeWorkspace({
          onCreate(dir) {
            path = dir;
            if (stage === 'setup') throw failure;
          },
        });
        expect(await Fs.exists(fixture.fs.dir)).to.eql(true);
        if (stage === 'body') throw failure;
      } catch (error) {
        caught = error;
      }
      expect(caught).to.equal(stage === 'success' ? undefined : failure);
      if (!Is.str(path)) throw new Error('Expected acquired workspace path.');
      expect(await Fs.exists(path)).to.eql(false);
    });
  }

  it('serves target dist index.html and emitted js from cwd + targetDir', async () => {
    await using fixture = await createServeWorkspace();

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
    await using fixture = await createServeWorkspace();

    const app = await DenoEntry.serve({
      cwd: fixture.fs.dir,
      targetDir: fixture.targetDir,
    });

    const res = await app.fetch(new Request('http://local/pkg/missing.js'));
    expect(res.status).to.eql(404);
    expect(await res.text()).to.eql('Not Found');
  });

  it('falls back to index.html for non-asset routes', async () => {
    await using fixture = await createServeWorkspace();

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
    await using fixture = await createServeWorkspace({ withIndexHtml: false });

    const app = await DenoEntry.serve({
      cwd: fixture.fs.dir,
      targetDir: fixture.targetDir,
    });

    const res = await app.fetch(new Request('http://local/dashboard'));
    expect(res.status).to.eql(500);
    expect(await res.text()).to.contain('Missing dist index.html');
  });

  it('serves from distDir override when provided', async () => {
    await using fixture = await createServeWorkspace({
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

  it('delegates to package-local src/entry.ts when present', async () => {
    await using fixture = await createServeWorkspace({
      entrySource: Str.dedent(`
        export async function main(ctx) {
          return {
            fetch() {
              return new Response(\`entry:\${ctx.targetDir}\`, {
                headers: { 'content-type': 'text/plain; charset=utf-8' },
              });
            },
          };
        }
      `),
    });

    const app = await DenoEntry.serve({
      cwd: fixture.fs.dir,
      targetDir: fixture.targetDir,
    });

    const res = await app.fetch(new Request('http://local/'));
    expect(res.status).to.eql(200);
    expect(res.headers.get('content-type')).to.contain('text/plain');
    expect(await res.text()).to.eql(`entry:${fixture.targetDir}`);
  });

  it('does not require dist artifacts when package-local src/entry.ts is present', async () => {
    await using fixture = await createServeWorkspace({
      entrySource: Str.dedent(`
        export function main() {
          return { fetch() { return new Response('entry-only'); } };
        }
      `),
    });
    await Fs.remove(fixture.fs.join('code/projects/foo/dist'));

    const app = await DenoEntry.serve({
      cwd: fixture.fs.dir,
      targetDir: fixture.targetDir,
    });

    const res = await app.fetch(new Request('http://local/'));
    expect(res.status).to.eql(200);
    expect(await res.text()).to.eql('entry-only');
  });

  it('rejects package entry files without an exported main', async () => {
    await using fixture = await createServeWorkspace({
      entrySource: `export const nope = true;\n`,
    });

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
    if (!Is.error(err)) throw err;
    expect(err.message).to.contain(`missing exported 'main'`);
  });

  it('rejects targetDir values that escape cwd', async () => {
    await using fixture = await createServeWorkspace();

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
    if (!Is.error(err)) throw err;
    expect(err.message).to.contain(`DenoEntry.serve: 'targetDir' escapes root`);
  });

  for (const label of ['targetDir', 'distDir'] as const) {
    it(`sibling-prefix ${label} → refusal before source package import`, async () => {
      await using fixture = await createServeWorkspace();
      const target = fixture.fs.join('code/projects/foo');
      const sibling = fixture.fs.join('code/projects/foobar');
      const pkg = Fs.join(label === 'targetDir' ? sibling : target, 'src/pkg.ts');
      await Fs.write(pkg, `throw new Error('Forbidden package import.');\n`, { throw: true });
      let failure: unknown;
      try {
        await DenoEntry.serve(
          label === 'targetDir'
            ? { cwd: target, targetDir: '../foobar' }
            : { cwd: fixture.fs.dir, targetDir: fixture.targetDir, distDir: '../foobar/dist' },
        );
      } catch (error) {
        failure = error;
      }
      expect(failure).to.be.instanceOf(Error);
      if (!Is.error(failure)) throw new Error('Expected path admission refusal.');
      expect(failure.message).to.contain(`DenoEntry.serve: '${label}' escapes root`);
    });
  }

  it('selected root alias → local consistency and normal serving', async () => {
    await using fixture = await createServeWorkspace();
    const cwd = fixture.fs.join('code/projects/foo');
    const app = await DenoEntry.serve({ cwd, targetDir: './.' });
    const response = await app.fetch(new Request('http://local/'));
    expect(await response.text()).to.eql(fixture.html);
    expect(response.status).to.eql(200);
    expect(response.headers.get('pkg-digest')).to.eql(fixture.hash);
  });

  it('working-directory alias → local observation without accepting a selected Dist symlink', async () => {
    await using fixture = await createServeWorkspace();
    const alias = fixture.fs.join('cwd-alias');
    const root = await Fs.realPath(fixture.fs.dir);
    try {
      await Fs.ensureSymlink(root, alias);
      const app = await DenoEntry.serve({ cwd: alias, targetDir: fixture.targetDir });
      const response = await app.fetch(new Request('http://local/'));
      expect(await response.text()).to.eql(fixture.html);
      expect(response.status).to.eql(200);

      const target = fixture.fs.join('code/projects/foo');
      await Fs.ensureSymlink(Fs.join(target, 'dist'), Fs.join(target, 'linked'));
      let failure: unknown;
      try {
        await DenoEntry.serve({ cwd: alias, targetDir: fixture.targetDir, distDir: 'linked' });
      } catch (error) {
        failure = error;
      }
      expect(failure).to.be.instanceOf(Error);
      if (!Is.error(failure)) throw failure;
      expect(failure.message).to.contain('UNPINNED local verification refusal: symlink');
    } finally {
      await Fs.remove(alias);
    }
  });

  it('consistent oversized manifest → resource refusal, not an inconsistency claim', async () => {
    await using fixture = await createServeWorkspace();
    const cwd = await Fs.realPath(fixture.fs.dir);
    const dir = Fs.join(cwd, 'code/projects/foo/dist');
    const path = Fs.join(dir, 'dist.json');
    const read = await Fs.readText(path);
    if (!Is.str(read.data)) throw new Error('Expected the generated manifest.');
    // JSON whitespace changes document size, not its inventory or payload consistency.
    await Fs.write(path, ' '.repeat(4 * 1024 * 1024) + read.data, { throw: true });
    const checked = await Pkg.Dist.Local.verify({
      dir,
      limits: {
        manifestBytes: 8 * 1024 * 1024,
        entries: 16_384,
        fileBytes: 64 * 1024 * 1024,
        totalBytes: 512 * 1024 * 1024,
      },
    });
    expect(checked.kind).to.eql('verified');
    if (checked.kind !== 'verified') throw new Error('Expected a consistent over-budget artifact.');
    expect(checked.evidence.content.digest).to.eql(fixture.hash);
    expect(checked.evidence.manifestBytes).to.be.greaterThan(4 * 1024 * 1024);

    let failure: unknown;
    try {
      await DenoEntry.serve({ cwd: fixture.fs.dir, targetDir: fixture.targetDir });
    } catch (error) {
      failure = error;
    }
    if (!Is.error(failure)) throw new Error('Expected the bounded verifier to refuse.');
    expect(failure.message).to.contain('DenoEntry.serve: local Dist verification refused.');
    expect(failure.message).to.contain('UNPINNED local verification refusal: limit-exceeded');
    expect(failure.message).not.to.contain('inconsistent');
  });

  it('payload tampering → local verification refusal at startup', async () => {
    await using fixture = await createServeWorkspace();
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
    if (!Is.error(err)) throw err;
    expect(err.message).to.contain('DenoEntry.serve: local Dist verification refused.');
  });
});
