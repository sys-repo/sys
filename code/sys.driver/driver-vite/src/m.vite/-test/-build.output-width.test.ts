import { c, Cli, describe, expect, HashFmt, it, Path, Str, stripAnsi } from '../../-test/common.ts';
import { ViteLog } from '../../m.fmt/mod.ts';
import { Log } from '../u/u.log.ts';

const hash = `sha256-${'88f8e3e041df504c3177b35ad742f4aebf99951a0c832fb64c1e1b2edef'}ccd11`;

function expectBounded(text: string, width: number) {
  text.split('\n').forEach((line) => {
    expect(Cli.Fmt.Text.Width.measure(line)).to.be.at.most(width);
  });
}

describe('Vite.build output formatting', () => {
  it('bundle metadata → indented labels and one aligned value column', () => {
    const text = ViteLog.Bundle.toString({
      ok: true,
      dirs: { in: './src/ui/index.html', out: './dist' },
      totalSize: 490_000,
      pkg: { name: '@sample/app', version: '0.0.2' },
      pkgSize: 489_000,
      hash,
      elapsed: 4_000,
      width: 100,
    });
    expect(stripAnsi(text)).to.eql(Str.dedent(`
      Bundle    490 kB (4s)
        pkg:    @sample/app@0.0.2 /pkg:489 kB
        in:     src/ui/index.html
        out:    dist/dist.json ← digest:sha256:#ccd11
                ${hash}
    `));
  });

  it('build paths → directory with aligned tree children', () => {
    const cwd = '/sample/project';
    const text = Log.Build.paths({
      cwd,
      paths: {
        cwd,
        app: { entry: './src/index.html', outDir: './dist', base: './' },
      },
      width: 80,
    });
    expect(stripAnsi(text)).to.eql(Str.dedent(`
      directory:   /sample/project/
       ├─ entry:   src/index.html
       ├─ outDir:  dist/
       └─ base:    ./
    `));
  });

  it('output directory → folder link resolved against the build directory', () => {
    const cwd = Path.resolve('/sample/project');
    const target = Path.toFileUrl(Path.resolve(cwd, 'build output #1'));
    const outputs = ['./build output #1', Path.resolve(cwd, 'build output #1')];
    for (const outDir of outputs) {
      for (const width of [24, 100]) {
        const text = Log.Build.paths({
          cwd,
          paths: { cwd, app: { entry: './src/index.html', outDir, base: './' } },
          width,
        });
        const row = text.split('\n')[2];
        expect(row).to.include(`${target.href}/`);
        expectBounded(text, width);
        if (width === 24) expect(stripAnsi(row)).to.include('…');
        else expect(stripAnsi(row)).to.include('build output #1/');
      }
    }
  });

  it('HTTP bases → full link targets even when their labels are clipped', () => {
    const cwd = '/sample/project/資料/with/a/long/directory/name';
    for (const protocol of ['http:', 'https:']) {
      const base = `${protocol}//assets.example.test/a%20b/long/path?mode=sample#section`;
      for (const width of [0, 8, 13, 14, 48, 100]) {
        const text = Log.Build.paths({
          cwd,
          paths: {
            cwd,
            app: { entry: './src/資料/index.html', outDir: './dist', base },
          },
          width,
        });
        expectBounded(text, width);
        if (width <= 13) {
          expect(text).not.to.include('\x1b]8;;');
        } else {
          expect(text).to.include(base);
          const plain = stripAnsi(text);
          if (width < 100) expect(plain).not.to.include(base);
          else expect(plain).to.include(` └─ base:    ${base}`);
        }
      }
    }
  });

  it('non-HTTP bases → unchanged plain text without an invented link', () => {
    const cwd = '/sample/project';
    const bases = ['', './', '/', '/assets/', '//cdn.test/app/', 'https://', 'file:///app/'];
    for (const base of bases) {
      const text = Log.Build.paths({
        cwd,
        paths: { cwd, app: { entry: './src/index.html', outDir: './dist', base } },
        width: 100,
      });
      const lastLine = text.split('\n').at(-1) ?? '';
      expect(lastLine).not.to.include('\x1b]8;;');
      expect(stripAnsi(lastLine).trimEnd()).to.eql(` └─ base:    ${base}`.trimEnd());
    }
  });

  it('keeps the build paths prelude within the requested width', () => {
    const text = Log.Build.paths({
      cwd: '/sample/workspace/with/a/very/long/path/to/ui-components',
      paths: {
        cwd: '/sample/workspace/with/a/very/long/path/to/ui-components',
        app: { entry: './src/index.html', outDir: './dist', base: './' },
      },
      width: 48,
    });
    const plain = stripAnsi(text);

    const directoryLine = plain.split('\n').find((line) => line.includes('directory:')) ?? '';

    expectBounded(text, 48);
    expect(plain.startsWith('directory:')).to.eql(true);
    expect(plain).to.include('src/index.html');
    expect(directoryLine).to.include('…');
    expect(directoryLine).to.include('ui-components/');
  });

  it('keeps rows bounded even at extremely narrow widths', () => {
    const paths = Log.Build.paths({
      cwd: '/sample/workspace/with/a/very/long/path/to/ui-components',
      paths: {
        cwd: '/sample/workspace/with/a/very/long/path/to/ui-components',
        app: { entry: './src/index.html', outDir: './dist', base: './' },
      },
      width: 8,
    });
    const bundle = ViteLog.Bundle.toString({
      ok: true,
      dirs: { in: './src/index.html', out: './dist' },
      totalSize: 2_350_000,
      pkg: { name: '@sys/ui-components-with-a-long-name', version: '0.0.319' },
      pkgSize: 1_820_000,
      hash,
      elapsed: 4_000,
      width: 8,
    });

    expectBounded(paths, 8);
    expectBounded(bundle, 8);
  });

  it('links the bundle manifest label without linking its digest', () => {
    const manifestUrl = Path.toFileUrl(Path.resolve('bundle digest #1/dist.json'));
    const text = ViteLog.Bundle.toString({
      ok: true,
      dirs: { in: './src/index.html', out: './dist' },
      totalSize: 2_350_000,
      hash,
      manifestUrl,
      elapsed: 4_000,
      width: 80,
    });
    const digest = HashFmt.digest(hash);

    expect(text).to.include(Cli.Fmt.hyperlink('dist.json', manifestUrl, { underline: true }));
    expect(text).to.not.include(Cli.Fmt.hyperlink(digest, manifestUrl, { underline: true }));
    expect(stripAnsi(text)).to.include(`dist/dist.json ← ${stripAnsi(digest)}`);
    expect(manifestUrl.protocol).to.eql('file:');
    expect(manifestUrl.hash).to.eql('');
    expect(manifestUrl.href).to.include('bundle%20digest%20%231/dist.json');
  });

  it('keeps compact bundle digests beside their linked manifest label', () => {
    const manifestUrl = Path.toFileUrl(Path.resolve('bundle digest #1/dist.json'));
    const text = ViteLog.Bundle.toString({
      ok: true,
      dirs: { in: './src/index.html', out: './dist' },
      totalSize: 2_350_000,
      hash,
      manifestUrl,
      elapsed: 4_000,
      width: 40,
    });
    const compact = HashFmt.digest(hash, { maxWidth: 13 });

    expectBounded(text, 40);
    expect(text).to.include(Cli.Fmt.hyperlink('dist.json', manifestUrl, { underline: true }));
    expect(text).to.not.include(Cli.Fmt.hyperlink(compact, manifestUrl, { underline: true }));
    expect(stripAnsi(text)).to.include('dist/dist.json ← sha256:#ccd11');
  });

  it('does not link a failed bundle manifest', () => {
    const text = ViteLog.Bundle.toString({
      ok: false,
      dirs: { in: './src/index.html', out: './dist' },
      totalSize: 2_350_000,
      hash,
      manifestUrl: Path.toFileUrl(Path.resolve('bundle digest #1/dist.json')),
      elapsed: 4_000,
      width: 80,
    });

    expectBounded(text, 80);
    expect(text).to.not.include('\x1b]8;;');
    expect(stripAnsi(text)).to.include('dist/dist.json ← digest:sha256:#ccd11');
  });

  it('keeps bundle summary rows within the requested width', () => {
    const text = ViteLog.Bundle.toString({
      ok: true,
      dirs: { in: './src/index.html', out: './dist' },
      totalSize: 2_350_000,
      pkg: { name: '@sys/ui-components-with-a-long-name', version: '0.0.319' },
      pkgSize: 1_820_000,
      hash,
      elapsed: 4_000,
      width: 52,
    });
    const plain = stripAnsi(text);

    expectBounded(text, 52);
    const hashLine = text.split('\n').find((line) => stripAnsi(line).includes('sha256-')) ?? '';
    const plainHashLine = stripAnsi(hashLine);

    expect(plain).to.include('Bundle');
    expect(plainHashLine).to.include('sha256-');
    expect(plainHashLine).to.include('…');
    expect(plainHashLine).to.include('ccd11');
    expect(plainHashLine).to.not.include(hash);
    expect(hashLine).to.include(c.gray('ccd11'));
  });

  it('keeps captured Vite stdio and the bundle summary width-safe', () => {
    const stdio = [
      'dist/pkg/m.really-long-generated-entry-file-name-with-extra-suffix.js  380.13 kB | gzip: 116.78 kB',
      '✓ built in 3.59s',
    ].join('\n');

    const text = Log.Build.toString({
      ok: true,
      stdio,
      dirs: { in: './src/index.html', out: './dist' },
      totalSize: 2_350_000,
      pkg: { name: '@sys/ui-components', version: '0.0.319' },
      pkgSize: 1_820_000,
      hash,
      elapsed: 4_000,
      width: 60,
    });
    const plain = stripAnsi(text);
    const clippedViteRow = text.split('\n')[0];
    const [head = '', tail = ''] = stripAnsi(clippedViteRow).split('…');

    expectBounded(text, 60);
    expect(clippedViteRow).to.include(c.gray(head));
    expect(clippedViteRow).to.include(c.dim(c.gray('…')));
    expect(clippedViteRow).to.include(c.gray(tail));
    expect(stripAnsi(clippedViteRow)).to.include('dist/pkg/m.');
    expect(stripAnsi(clippedViteRow)).to.include('…');
    expect(stripAnsi(clippedViteRow)).to.include('116.78 kB');
    expect(plain).to.include('built in 3.59s\n\nBundle');
  });
});
