import { describe, expect, it } from '../../../-test.ts';
import { c, Fmt, stripAnsi } from '../../mod.ts';

describe('Cli.Fmt.Path', () => {
  it('renders a gray path with a white basename', () => {
    const path = 'foo/bar/a.ts';

    const inner = Fmt.path('./foo/bar/a.ts', Fmt.Path.fmt());
    expect(inner).to.eql(`./foo/bar/${c.white('a.ts')}`);

    const res = Fmt.Path.str(path);
    expect(res).to.eql(c.gray(inner));
  });

  it('prefixes relative display paths with ./', () => {
    expect(Fmt.Path.str('dist')).to.eql(c.gray(`./${c.white('dist')}`));
    expect(Fmt.Path.str('-config/view.yaml')).to.eql(
      c.gray(`./-config/${c.white('view.yaml')}`),
    );
    expect(Fmt.Path.str('./dist')).to.eql(c.gray(`./${c.white('dist')}`));
    expect(Fmt.Path.str('/tmp/dist')).to.eql(c.gray(`/tmp/${c.white('dist')}`));
    expect(Fmt.Path.str('.')).to.eql(c.gray('./'));
  });

  it('tty: returns the full formatted path outside a terminal', () => {
    const path = '/var/folders/example/sys-server-files-http-cmd-abcdef/dist.json';
    expect(Fmt.Path.tty(path, { terminal: false, width: 20 })).to.eql(Fmt.Path.str(path));
  });

  it('tty: shortens terminal paths with a dim gray inserted omission marker', () => {
    const path = '/abcdefghij/klmnopqr/file.txt';
    const res = Fmt.Path.tty(path, { terminal: true, width: 14, min: 1 });

    expect(stripAnsi(res)).to.eql('/abcdef…le.txt');
    expect(res).to.contain(Fmt.omission('…'));
    expect(res).not.to.contain(c.cyan('…'));
  });

  it('tty: can keep the basename gray for table detail values', () => {
    const path = '/abcdefghij/klmnopqr/file.txt';
    const res = Fmt.Path.tty(path, {
      terminal: true,
      width: 14,
      min: 1,
      highlightBasename: false,
    });

    expect(stripAnsi(res)).to.eql('/abcdef…le.txt');
    expect(res).to.contain(Fmt.omission('…'));
    expect(res).not.to.contain(c.cyan('…'));
    expect(res).not.to.contain(c.white('le.txt'));
  });

  it('tty: can fit muted package-relative table paths outside terminal detection', () => {
    const short = Fmt.Path.tty('src/file.ts', {
      terminal: false,
      fit: 'width',
      width: 80,
      highlightBasename: false,
      relative: 'bare',
      tone: 'muted',
    });

    expect(stripAnsi(short)).to.eql('src/file.ts');
    expect(short).to.eql(c.dim(c.gray('src/file.ts')));

    const clipped = Fmt.Path.tty('src/deep/long/file.ts', {
      terminal: false,
      fit: 'width',
      width: 12,
      min: 1,
      highlightBasename: false,
      relative: 'bare',
      tone: 'muted',
    });

    expect(stripAnsi(clipped)).to.eql('src/de…le.ts');
    expect(clipped).to.contain(c.dim(c.gray('…')));
    expect(clipped).not.to.contain(c.cyan('…'));
  });

  it('tty: does not color literal ellipses that already exist in paths', () => {
    const path = '/abcdefghij/kl…mnopqr/extra/file.txt';
    const res = Fmt.Path.tty(path, { terminal: true, width: 30, min: 1 });

    expect(stripAnsi(res)).to.contain('……');
    expect(res.split(Fmt.omission('…')).length).to.eql(2);
  });
});
