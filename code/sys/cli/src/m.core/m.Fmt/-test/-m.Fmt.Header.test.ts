import { c, describe, expect, it } from '../../../-test.ts';
import { Cli, Fmt } from '../../mod.ts';

const pkg = { name: '@sys/example', version: '0.0.1' } as const;

describe('Cli.Fmt.Header', () => {
  it('renders a toned package identity, right-aligned default version, and heavy rule', () => {
    const width = 32;
    const rows = Fmt.Header.rows({ pkg, width, tone: 'cyan' });
    const [header = '', rule = ''] = rows;

    expect(rows).to.have.length(2);
    expect(Object.isFrozen(rows)).to.eql(true);
    expect(header).to.include(c.bold(c.cyan(pkg.name)));
    expect(header).to.include(c.dim(c.cyan(pkg.version)));
    expect(Cli.Fmt.Text.Width.measure(header)).to.eql(width);
    expect(Cli.stripAnsi(header).endsWith(pkg.version)).to.eql(true);
    expect(rule).to.eql(c.cyan(Cli.Fmt.hr({ width })));
  });

  it('preserves bold/dim hierarchy without inventing a default color', () => {
    const width = 32;
    const [header = '', rule = ''] = Fmt.Header.rows({ pkg, width });

    expect(header).to.include(c.bold(pkg.name));
    expect(header).to.include(c.dim(pkg.version));
    expect(rule).to.eql(Cli.Fmt.hr({ width }));
  });

  it('defaults to an unpadded Untitled identity with no right lane', () => {
    const width = 12;
    const [header = '', rule = ''] = Fmt.Header.rows({ width });

    expect(header).to.eql(c.bold('Untitled'));
    expect(Cli.stripAnsi(header)).to.eql('Untitled');
    expect(Cli.Fmt.Text.Width.measure(header)).to.eql('Untitled'.length);
    expect(rule).to.eql(Cli.Fmt.hr({ width }));
  });

  it('preserves ANSI-aware custom-title alignment and Unicode cell widths', () => {
    const title = `${c.bold(c.cyan('sys:pi'))}${c.dim(c.cyan(':sandbox'))}`;
    const custom = Fmt.Header.rows({
      pkg,
      width: 42,
      tone: 'cyan',
      title,
      detail: 'read, write, bash',
    })[0] ?? '';

    expect(custom.startsWith(title)).to.eql(true);
    expect(custom).to.include(c.cyan('read, write, bash'));
    expect(custom).to.include(c.dim(c.cyan(' · ')));
    expect(Cli.Fmt.Text.Width.measure(custom)).to.eql(42);

    const unicodePkg = { name: '@sys/界面', version: '1.0.0' } as const;
    const width = Cli.Fmt.Text.Width.measure(unicodePkg.name) + 1 + unicodePkg.version.length;
    const unicode = Fmt.Header.rows({ pkg: unicodePkg, width, tone: 'magenta' })[0] ?? '';

    expect(Cli.Fmt.Text.Width.measure(unicode)).to.eql(width);
    expect(Cli.stripAnsi(unicode).startsWith(unicodePkg.name)).to.eql(true);
    expect(Cli.stripAnsi(unicode).endsWith(unicodePkg.version)).to.eql(true);
  });

  it('uses the locked pressure order at exact candidate boundaries', () => {
    const target = { name: '@sys/ui', version: '1.2.3' } as const;
    const render = (width: number) =>
      Cli.stripAnsi(Fmt.Header.rows({ pkg: target, width, detail: 'read' })[0] ?? '');

    expect(render(20)).to.eql('@sys/ui read · 1.2.3');
    expect(render(15)).to.eql('ui read · 1.2.3');
    expect(render(14)).to.eql('@sys/ui  1.2.3');
    expect(render(12)).to.eql('ui     1.2.3');
    expect(render(7)).to.eql('@sys/ui');
    expect(render(6)).to.eql('ui');
    expect(render(1)).to.eql('…');
  });

  it('normalizes version and detail overrides without losing detail-only metadata', () => {
    const override = Cli.stripAnsi(
      Fmt.Header.rows({ pkg, width: 24, version: ' 9.9.9 ' })[0] ?? '',
    );
    const omitted = Cli.stripAnsi(
      Fmt.Header.rows({ pkg, width: 24, detail: ' status ', version: false })[0] ?? '',
    );
    const empty = Cli.stripAnsi(
      Fmt.Header.rows({ pkg, width: 24, detail: ' status ', version: '   ' })[0] ?? '',
    );
    const standalone = Cli.stripAnsi(
      Fmt.Header.rows({
        title: 'standalone',
        width: 24,
        detail: 'ready',
        version: '2.0.0',
      })[0] ?? '',
    );

    expect(override.endsWith('9.9.9')).to.eql(true);
    expect(override).not.to.include(pkg.version);
    expect(omitted.endsWith('status')).to.eql(true);
    expect(omitted).not.to.include('·');
    expect(omitted).not.to.include(pkg.version);
    expect(empty.endsWith('status')).to.eql(true);
    expect(empty).not.to.include('·');
    expect(standalone.startsWith('standalone')).to.eql(true);
    expect(standalone.endsWith('ready · 2.0.0')).to.eql(true);
  });

  it('preserves custom semantic identity through the final plain-title ellipsis', () => {
    const target = { name: '@sys/driver-pi', version: '1.0.0' } as const;
    const semantic = 'sys:pi:sandbox';
    const title = c.bold(c.cyan(semantic));
    const detail = 'read, write, bash';
    const fullWidth = Cli.Fmt.Text.Width.measure(
      `${semantic} ${detail} · ${target.version}`,
    );
    const pressured = Fmt.Header.rows({
      pkg: target,
      width: fullWidth - 1,
      title,
      detail,
      tone: 'cyan',
    })[0] ?? '';
    const fallbackTitle = 'custom-application-title';
    const fallback = Fmt.Header.rows({
      pkg: target,
      width: 9,
      title: c.bold(c.cyan(fallbackTitle)),
      tone: 'cyan',
    })[0] ?? '';
    const fallbackPlain = Cli.Fmt.Text.ellipsize(fallbackTitle, 9);

    expect(Cli.Fmt.Text.Width.measure(pressured)).to.eql(fullWidth - 1);
    expect(Cli.stripAnsi(pressured).startsWith(semantic)).to.eql(true);
    expect(Cli.stripAnsi(pressured).endsWith(target.version)).to.eql(true);
    expect(pressured).not.to.include(detail);
    expect(Cli.stripAnsi(fallback)).to.eql(fallbackPlain);
    expect(fallback).to.eql(c.bold(c.cyan(fallbackPlain)));
  });

  it('passes rule color and weight through while supporting title-only output', () => {
    const dashed = Fmt.Header.rows({
      pkg,
      width: 8,
      tone: 'cyan',
      hr: { color: 'magenta', weight: 'dashed' },
    });

    expect(dashed[1]).to.eql(c.magenta(Cli.Fmt.hr({ width: 8, weight: 'dashed' })));
    expect(Fmt.Header.rows({ pkg, width: 4, hr: { weight: 'light' } })[1]).to.eql('─'.repeat(4));
    expect(Fmt.Header.rows({ pkg, width: 4, hr: { weight: 'double' } })[1]).to.eql('═'.repeat(4));
    expect(Fmt.Header.rows({ pkg, width: 8, hr: false })).to.have.length(1);
  });

  it('uses canonical omitted-width policy and deterministic explicit-width normalization', () => {
    const automatic = Fmt.Header.rows({ pkg });
    const automaticWidth = Cli.Fmt.Text.Width.fit();

    expect(Cli.Fmt.Text.Width.measure(automatic[0] ?? '')).to.eql(automaticWidth);
    expect(Cli.Fmt.Text.Width.measure(automatic[1] ?? '')).to.eql(automaticWidth);
    expect(Fmt.Header.rows({ pkg, width: 0 })).to.eql([]);
    expect(Fmt.Header.rows({ pkg, width: -1 })).to.eql([]);
    expect(Fmt.Header.rows({ pkg, width: Number.NaN })).to.eql([]);
    expect(Fmt.Header.rows({ pkg, width: Number.POSITIVE_INFINITY })).to.eql([]);
    expect(Cli.Fmt.Text.Width.measure(Fmt.Header.rows({ pkg, width: 4.9 })[1] ?? '')).to.eql(4);
  });
});
