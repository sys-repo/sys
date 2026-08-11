import { c, describe, expect, it } from '../../../-test.ts';
import { Cli, Fmt } from '../../mod.ts';

const pkg = { name: '@sys/example', version: '0.0.1' } as const;

type HeaderOptions = Parameters<typeof Fmt.Header.rows>[0];

const firstRow = (options: HeaderOptions) => Fmt.Header.rows(options)[0] ?? '';
const plainRow = (options: HeaderOptions) => Cli.stripAnsi(firstRow(options));

describe('Cli.Fmt.Header', () => {
  describe('.rows', () => {
    describe('package identity', () => {
      it('renders a toned identity, right-aligned version, and heavy rule', () => {
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

      it('renders a scoped compound identity with a dim application suffix', () => {
        const root = { name: '@sys/driver-pi', version: '1.0.0' } as const;
        const width = '@sys/driver-pi/ui 1.0.0'.length;
        const header = firstRow({
          pkg: { root, subpath: ' /ui/ ' },
          width,
          tone: 'cyan',
        });
        const expected = `${c.bold(c.cyan(root.name))}${c.dim(c.cyan('/ui'))} ${
          c.dim(c.cyan(root.version))
        }`;

        expect(header).to.eql(expected);
        expect(Cli.stripAnsi(header)).to.eql('@sys/driver-pi/ui 1.0.0');
        expect(Cli.Fmt.Text.Width.measure(header)).to.eql(width);
      });

      it('preserves compatibility with an embedded scoped subpath', () => {
        const header = firstRow({
          pkg: { name: '@sys/driver-pi/ui', version: '1.0.0' },
          version: false,
          width: '@sys/driver-pi/ui'.length,
        });

        expect(header).to.eql(`${c.bold('@sys/driver-pi')}${c.dim('/ui')}`);
      });

      it('joins embedded and compound subpaths in canonical order', () => {
        const header = firstRow({
          pkg: {
            root: { name: '@sys/driver-pi/ui', version: '1.0.0' },
            subpath: 'admin',
          },
          version: false,
          width: '@sys/driver-pi/ui/admin'.length,
        });

        expect(header).to.eql(`${c.bold('@sys/driver-pi')}${c.dim('/ui/admin')}`);
      });

      it('renders an unscoped compound identity', () => {
        const header = firstRow({
          pkg: {
            root: { name: 'application', version: '1.0.0' },
            subpath: 'ui',
          },
          version: false,
          width: 'application/ui'.length,
        });

        expect(header).to.eql(`${c.bold('application')}${c.dim('/ui')}`);
      });

      it('preserves compatibility with an embedded unscoped subpath', () => {
        const header = firstRow({
          pkg: { name: 'application/ui', version: '1.0.0' },
          version: false,
          width: 'application/ui'.length,
        });

        expect(header).to.eql(`${c.bold('application')}${c.dim('/ui')}`);
      });

      it('measures wide Unicode package identities by terminal columns', () => {
        const target = { name: '@sys/界面', version: '1.0.0' } as const;
        const width = Cli.Fmt.Text.Width.measure(target.name) + 1 + target.version.length;
        const header = firstRow({ pkg: target, width, tone: 'magenta' });
        const plain = Cli.stripAnsi(header);

        expect(Cli.Fmt.Text.Width.measure(header)).to.eql(width);
        expect(plain.startsWith(target.name)).to.eql(true);
        expect(plain.endsWith(target.version)).to.eql(true);
      });
    });

    describe('subpath normalization', () => {
      const render = (name: string, subpath?: string) =>
        plainRow({
          pkg: subpath === undefined
            ? { name, version: '1.0.0' }
            : { root: { name, version: '1.0.0' }, subpath },
          version: false,
          width: 80,
        });

      it('normalizes and joins embedded and compound sources', () => {
        expect(render('@sys/driver-pi//ui/', '//admin///settings//')).to.eql(
          '@sys/driver-pi/ui/admin/settings',
        );
      });

      it('omits an absent compound subpath', () => {
        expect(render('@sys/driver-pi', '///')).to.eql('@sys/driver-pi');
      });

      it('omits unsafe compound subpaths', () => {
        expect(render('@sys/driver-pi', c.red('ui'))).to.eql('@sys/driver-pi');
        expect(render('@sys/driver-pi', 'ui\nadmin')).to.eql('@sys/driver-pi');
        expect(render('@sys/driver-pi', 'ui\u202eadmin')).to.eql('@sys/driver-pi');
      });

      it('omits an unsafe embedded subpath', () => {
        expect(render('@sys/driver-pi/ui\nadmin')).to.eql('@sys/driver-pi');
      });

      it('degrades malformed runtime subpath input to the truthful root', () => {
        const header = firstRow({
          pkg: {
            root: { name: '@sys/driver-pi', version: '1.0.0' },
            subpath: 123 as unknown as string,
          },
          version: false,
          width: 80,
        });

        expect(Cli.stripAnsi(header)).to.eql('@sys/driver-pi');
      });
    });

    describe('fallback identity', () => {
      it('uses an unpadded Untitled identity when no right lane exists', () => {
        const width = 12;
        const [header = '', rule = ''] = Fmt.Header.rows({ width });

        expect(header).to.eql(c.bold('Untitled'));
        expect(Cli.stripAnsi(header)).to.eql('Untitled');
        expect(Cli.Fmt.Text.Width.measure(header)).to.eql('Untitled'.length);
        expect(rule).to.eql(Cli.Fmt.hr({ width }));
      });
    });

    describe('custom title', () => {
      it('tones a plain title and its explicit version', () => {
        const [header = '', rule = ''] = Fmt.Header.rows({
          title: 'sys.ui',
          version: '0.0.39',
          width: 32,
          tone: 'green',
        });

        expect(header).to.include(c.bold(c.green('sys.ui')));
        expect(header).to.include(c.dim(c.green('0.0.39')));
        expect(rule).to.eql(c.green(Cli.Fmt.hr({ width: 32 })));
      });

      it('leaves a plain title unchanged when no tone is requested', () => {
        expect(firstRow({ title: 'sys.ui', width: 32 })).to.eql('sys.ui');
      });

      it('takes precedence over package identity while retaining package metadata defaults', () => {
        const title = `${c.bold(c.cyan('sys:pi'))}${c.dim(c.cyan(':sandbox'))}`;
        const header = firstRow({
          pkg: { root: pkg, subpath: 'ui' },
          width: 42,
          tone: 'cyan',
          title,
          detail: 'read, write, bash',
        });

        const plain = Cli.stripAnsi(header);
        expect(header.startsWith(title)).to.eql(true);
        expect(plain).not.to.include('/ui');
        expect(plain.endsWith(pkg.version)).to.eql(true);
        expect(header).to.include(c.cyan('read, write, bash'));
        expect(header).to.include(c.dim(c.cyan(' · ')));
        expect(Cli.Fmt.Text.Width.measure(header)).to.eql(42);
      });
    });

    describe('metadata', () => {
      it('uses a normalized version override instead of the package version', () => {
        const header = plainRow({ pkg, width: 24, version: ' 9.9.9 ' });

        expect(header.endsWith('9.9.9')).to.eql(true);
        expect(header).not.to.include(pkg.version);
      });

      it('retains detail-only metadata when version is explicitly omitted', () => {
        const header = plainRow({ pkg, width: 24, detail: ' status ', version: false });

        expect(header.endsWith('status')).to.eql(true);
        expect(header).not.to.include('·');
        expect(header).not.to.include(pkg.version);
      });

      it('retains detail-only metadata when a version override normalizes to empty', () => {
        const header = plainRow({ pkg, width: 24, detail: ' status ', version: '   ' });

        expect(header.endsWith('status')).to.eql(true);
        expect(header).not.to.include('·');
      });

      it('renders standalone detail and version metadata', () => {
        const header = plainRow({
          title: 'standalone',
          width: 24,
          detail: 'ready',
          version: '2.0.0',
        });

        expect(header.startsWith('standalone')).to.eql(true);
        expect(header.endsWith('ready · 2.0.0')).to.eql(true);
      });
    });

    describe('width pressure', () => {
      it('uses the locked package candidate order at exact boundaries', () => {
        const target = { name: '@sys/ui', version: '1.2.3' } as const;
        const render = (width: number) => plainRow({ pkg: target, width, detail: 'read' });

        expect(render(20)).to.eql('@sys/ui read · 1.2.3');
        expect(render(15)).to.eql('ui read · 1.2.3');
        expect(render(14)).to.eql('@sys/ui  1.2.3');
        expect(render(12)).to.eql('ui     1.2.3');
        expect(render(7)).to.eql('@sys/ui');
        expect(render(6)).to.eql('ui');
        expect(render(1)).to.eql('…');
      });

      it('keeps package ownership through full and compact subpath candidates', () => {
        const root = { name: '@sys/driver-pi', version: '1.2.3' } as const;
        const render = (width: number) =>
          plainRow({ pkg: { root, subpath: 'ui' }, width, detail: 'read' });

        expect(render(30)).to.eql('@sys/driver-pi/ui read · 1.2.3');
        expect(render(25)).to.eql('driver-pi/ui read · 1.2.3');
        expect(render(23)).to.eql('@sys/driver-pi/ui 1.2.3');
        expect(render(18)).to.eql('driver-pi/ui 1.2.3');
        expect(render(17)).to.eql('@sys/driver-pi/ui');
        expect(render(12)).to.eql('driver-pi/ui');
      });

      it('retains bold package ownership when ellipsis falls within the root', () => {
        const header = firstRow({
          pkg: {
            root: { name: '@sys/driver-pi', version: '1.2.3' },
            subpath: 'ui',
          },
          version: false,
          width: 11,
          tone: 'cyan',
        });

        expect(Cli.stripAnsi(header)).to.eql('drive…pi/ui');
        expect(header).to.eql(
          `${c.bold(c.cyan('drive'))}${c.bold(c.cyan('…'))}${c.bold(c.cyan('pi'))}${
            c.dim(c.cyan('/ui'))
          }`,
        );
      });

      it('retains dim hierarchy when ellipsis falls within the subpath', () => {
        const header = firstRow({
          pkg: {
            root: { name: 'app', version: '1.2.3' },
            subpath: 'abcdefghijklmnop',
          },
          version: false,
          width: 10,
          tone: 'cyan',
        });

        expect(Cli.stripAnsi(header)).to.eql('app/a…mnop');
        expect(header).to.eql(
          `${c.bold(c.cyan('app'))}${c.dim(c.cyan('/a'))}${c.dim(c.cyan('…'))}${
            c.dim(c.cyan('mnop'))
          }`,
        );
      });

      it('measures a pressured wide-Unicode subpath by terminal columns', () => {
        const header = firstRow({
          pkg: {
            root: { name: 'app', version: '1.2.3' },
            subpath: '界面界面界面',
          },
          version: false,
          width: 8,
          tone: 'cyan',
        });

        expect(Cli.Fmt.Text.Width.measure(header)).to.eql(8);
        expect(header).to.include(c.dim(c.cyan('…')));
      });

      it('preserves custom semantic identity before dropping overflowing detail', () => {
        const target = { name: '@sys/driver-pi', version: '1.0.0' } as const;
        const semantic = 'sys:pi:sandbox';
        const detail = 'read, write, bash';
        const fullWidth = Cli.Fmt.Text.Width.measure(`${semantic} ${detail} · ${target.version}`);
        const header = firstRow({
          pkg: target,
          width: fullWidth - 1,
          title: c.bold(c.cyan(semantic)),
          detail,
          tone: 'cyan',
        });
        const plain = Cli.stripAnsi(header);

        expect(Cli.Fmt.Text.Width.measure(header)).to.eql(fullWidth - 1);
        expect(plain.startsWith(semantic)).to.eql(true);
        expect(plain.endsWith(target.version)).to.eql(true);
        expect(header).not.to.include(detail);
      });

      it('preserves caller styling through final custom-title ellipsis', () => {
        const title = 'custom-application-title';
        const header = firstRow({
          pkg,
          width: 9,
          title: c.bold(c.cyan(title)),
          tone: 'cyan',
        });
        const expected = Cli.Fmt.Text.ellipsize(title, 9);

        expect(Cli.stripAnsi(header)).to.eql(expected);
        expect(header).to.eql(c.bold(c.cyan(expected)));
      });
    });

    describe('horizontal rule', () => {
      it('passes explicit color and weight overrides through', () => {
        const rows = Fmt.Header.rows({
          pkg,
          width: 8,
          tone: 'cyan',
          hr: { color: 'magenta', weight: 'dashed' },
        });

        expect(rows[1]).to.eql(c.magenta(Cli.Fmt.hr({ width: 8, weight: 'dashed' })));
      });

      it('supports canonical light and double weights', () => {
        expect(Fmt.Header.rows({ pkg, width: 4, hr: { weight: 'light' } })[1]).to.eql(
          '─'.repeat(4),
        );
        expect(Fmt.Header.rows({ pkg, width: 4, hr: { weight: 'double' } })[1]).to.eql(
          '═'.repeat(4),
        );
      });

      it('supports title-only output', () => {
        expect(Fmt.Header.rows({ pkg, width: 8, hr: false })).to.have.length(1);
      });
    });

    describe('width input', () => {
      it('uses canonical terminal width when width is omitted', () => {
        const rows = Fmt.Header.rows({ pkg });
        const width = Cli.Fmt.Text.Width.fit();

        expect(Cli.Fmt.Text.Width.measure(rows[0] ?? '')).to.eql(width);
        expect(Cli.Fmt.Text.Width.measure(rows[1] ?? '')).to.eql(width);
      });

      it('returns no rows for non-positive or non-finite explicit widths', () => {
        expect(Fmt.Header.rows({ pkg, width: 0 })).to.eql([]);
        expect(Fmt.Header.rows({ pkg, width: -1 })).to.eql([]);
        expect(Fmt.Header.rows({ pkg, width: Number.NaN })).to.eql([]);
        expect(Fmt.Header.rows({ pkg, width: Number.POSITIVE_INFINITY })).to.eql([]);
      });

      it('floors a positive fractional width deterministically', () => {
        const rule = Fmt.Header.rows({ pkg, width: 4.9 })[1] ?? '';

        expect(Cli.Fmt.Text.Width.measure(rule)).to.eql(4);
      });
    });
  });
});
