import { c, Cli, describe, expect, HashFmt, it, Path, stripAnsi } from '../../-test/common.ts';
import { ViteLog } from '../../m.fmt/mod.ts';
import { Log } from '../u/u.log.ts';

const hash = `sha256-${'88f8e3e041df504c3177b35ad742f4aebf99951a0c832fb64c1e1b2edef'}ccd11`;

function expectBounded(text: string, width: number) {
  stripAnsi(text).split('\n').forEach((line) => expect(line.length <= width).to.eql(true));
}

describe('Vite.build output formatting', () => {
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

    const directoryLine = plain.split('\n').find((line) => line.includes('Directory:')) ?? '';

    expectBounded(text, 48);
    expect(plain).to.include('Paths');
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

    expect(text).to.include(Cli.Fmt.hyperlink('dist.json', manifestUrl));
    expect(text).to.not.include(Cli.Fmt.hyperlink(digest, manifestUrl));
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
    expect(text).to.include(Cli.Fmt.hyperlink('dist.json', manifestUrl));
    expect(text).to.not.include(Cli.Fmt.hyperlink(compact, manifestUrl));
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
