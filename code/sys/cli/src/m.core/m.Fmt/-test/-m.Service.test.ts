import { describe, expect, it, Str, type t } from '../../../-test.ts';
import { c, Cli, Fmt, stripAnsi } from '../../mod.ts';

const plain = (input: t.CliFormat.Service.Input, options: t.CliFormat.Service.Options = {}) =>
  stripAnsi(Fmt.Service.format(input, { terminal: false, ...options }));
const detail = { label: 'shell', value: 'plain' };
const input = { name: 'example', status: { state: 'ready', details: [detail] } } as const;

// Physical line boundaries and OSC targets are deliberate byte-level contracts in these tests.
describe('Cli.Fmt.Service', () => {
  it('exposes one renderer through both public aggregates', () => {
    expect(Cli.Fmt.Service).to.equal(Fmt.Service);
    expect(plain({ name: 'example' })).to.eql('service   example');
    expect(Fmt.Service.format(input, { terminal: false })).to.eql(
      Fmt.Service.formatList([input], { terminal: false }),
    );
  });

  it('renders explicit identity, annotation, and facts in the standard hierarchy', () => {
    const rendered = Fmt.Service.format({
      name: 'selected',
      module: 'jsr:@test/service',
      annotation: '--mode=dev',
      status: {
        state: 'error',
        name: 'ignored',
        kind: 'ignored',
        config: 'ignored',
        root: './root',
        details: [{ label: 'connections', value: '3' }],
        error: { name: 'Error', message: 'failure' },
        urls: [{ href: 'http://localhost:8080/', label: 'ignored' }],
      },
      keyboard: { open: 'O', quit: 'Q' },
    }, { terminal: false });
    expect(stripAnsi(rendered)).to.eql(Str.dedent(`
      service        selected --mode=dev
       module        jsr:@test/service
       state         error
       root          ./root
       connections   3
       error         Error: failure
       url           http://localhost:8080/
       open          O
       quit          Q
    `));
    expect(rendered).to.contain(c.green('service'));
    expect(rendered).to.contain(c.white('selected'));
    expect(rendered).not.to.contain(c.bold(c.white('selected')));
    expect(rendered).to.contain(c.dim(c.cyan('--mode=dev')));
    expect(rendered).to.contain(c.underline(Fmt.Path.str('./root', { highlightBasename: false })));
    expect(plain({ name: 'literal --mode=word' })).to.eql('service   literal --mode=word');
  });

  it('measures columns across services and sizes only between-block separators', () => {
    const text = stripAnsi(Fmt.Service.formatList([
      { name: 'one', status: { state: 'ready', details: [{ label: 'long-label', value: 'x' }] } },
      { name: 'two', module: 'module' },
    ], { terminal: false }));
    const lines = text.split('\n');
    expect(lines[0].indexOf('one')).to.eql(lines[3].indexOf('two'));
    expect(lines[2]).to.match(/^┄+$/);
    expect(lines[2].length).to.eql(
      Math.max(...lines.filter((_, i) => i !== 2).map((v) => v.length)),
    );
    expect(text.startsWith('\n')).to.eql(false);
    expect(text.endsWith('\n')).to.eql(false);
  });

  it('wide multiline labels → one terminal-cell value column across services', () => {
    const services: t.CliFormat.Service.Input[] = [
      {
        name: '<one>',
        module: '<module>',
        status: { state: 'ready', details: [{ label: 'e\u0301', value: '<first>' }] },
      },
      {
        name: '<two>',
        status: {
          state: 'ready',
          details: [{ label: '東京東京東京\n👩‍💻', value: '<wide>\n<continued>\n<blank-label>' }],
        },
      },
    ];
    for (const width of [undefined, 40]) {
      const text = stripAnsi(Fmt.Service.formatList(services, { terminal: false, width }));
      const rows = text.split('\n').filter((line) => !/^┄+$/.test(line));
      expect(rows.length).to.eql(7);
      const prefixes = rows.map((line) => line.slice(0, line.indexOf('<')));
      // Six wide glyphs + one indent cell + three gap cells: column 16, not UTF-16 length.
      expect(prefixes.map((prefix) => Fmt.Text.Width.measure(prefix))).to.eql([
        16,
        16,
        16,
        16,
        16,
        16,
        16,
      ]);
      expect(prefixes[4]).to.eql(` 東京東京東京${' '.repeat(3)}`);
      expect(prefixes[5]).to.eql(` 👩‍💻${' '.repeat(13)}`);
      expect(prefixes[6]).to.eql(' '.repeat(16));
      expect(rows.map((line) => line.slice(line.indexOf('<')))).to.eql([
        '<one>',
        '<module>',
        '<first>',
        '<two>',
        '<wide>',
        '<continued>',
        '<blank-label>',
      ]);
    }
  });

  it('maximum viewport → admits 65,535 cells without allocating a viewport-sized value', () => {
    for (const terminal of [false, true]) {
      const budgets: (number | undefined)[] = [];
      const rendered = Fmt.Service.format({
        ...input,
        presentation: {
          formatDetail({ maxWidth }) {
            budgets.push(maxWidth);
            return undefined;
          },
        },
      }, { width: 65_535, terminal });
      expect(stripAnsi(rendered)).to.eql('service   example\n shell    plain');
      expect(budgets).to.eql([65_525]); // Seven label cells + three gap cells remain reserved.
    }
  });

  it('fits every physical line in terminal cells, including tiny widths', () => {
    const value: t.CliFormat.Service.Input = {
      name: '東京 👩‍💻 e\u0301 service',
      annotation: '--mode=dev',
      module: 'long module',
      status: {
        state: 'ready',
        root: '/long/path/東京',
        details: [{ label: '東京東京東京東京\nnext', value: '長'.repeat(30) + '\n\nlast' }],
        urls: [{ href: 'http://127.0.0.1:8080/long/path' }],
      },
    };
    for (const width of [1, 2, 3, 4, 5, 6, 7, 8, 12, 24, 42, 80]) {
      const rendered = Fmt.Service.format(value, { width, terminal: false });
      for (const line of rendered.split('\n')) {
        expect(Fmt.Text.Width.measure(line), `width ${width}`).to.be.at.most(width);
      }
    }
    expect(plain(value)).to.contain('長'.repeat(30));
    expect(plain(value, { width: 42.9 })).to.eql(plain(value, { width: 42 }));
  });

  it('preserves plain and rich blank continuations and meaningful empty values', () => {
    for (const formatDetail of [undefined, () => 'one\n\nlast']) {
      expect(plain({
        ...input,
        status: { state: 'ready', details: [{ label: 'a\nb', value: 'one\n\nlast' }] },
        presentation: { formatDetail },
      })).to.eql('service   example\n a        one\n b        \n          last');
    }
    expect(plain({ ...input, presentation: { formatDetail: () => '' } })).to.eql(
      'service   example\n shell    ',
    );
    expect(plain({ ...input, presentation: { formatDetail: () => '\none\n' } })).to.eql(
      'service   example\n shell    \n          one\n          ',
    );
  });

  it('calls a captured callback unbound once per detail after collection measurement', () => {
    let reads = 0;
    const calls: unknown[] = [];
    const presentation = {
      get formatDetail() {
        reads += 1;
        return function (this: unknown, args: { detail: t.Service.Detail; maxWidth?: number }) {
          calls.push({ receiver: this, ...args });
          return undefined;
        };
      },
    };
    Fmt.Service.formatList([
      { ...input, presentation },
      {
        name: 'second',
        status: { state: 'ready', details: [{ label: 'long-label', value: 'x' }] },
      },
    ], { width: 40 });
    expect(reads).to.eql(1);
    expect(calls).to.eql([{ receiver: undefined, detail, maxWidth: 26 }]);
  });

  it('falls back as a whole when any rich physical line exceeds the budget', () => {
    for (const formatDetail of [() => undefined, () => 'short\n' + 'x'.repeat(31)]) {
      expect(plain({ ...input, presentation: { formatDetail } }, { width: 40 })).to.eql(
        'service   example\n shell    plain',
      );
    }
    const rendered = Fmt.Service.format({
      ...input,
      presentation: { formatDetail: () => `${c.cyan('x'.repeat(30))}\n${c.green('ok')}` },
    }, { width: 40 });
    expect(rendered).to.contain(c.cyan('x'.repeat(30)));
    expect(rendered).to.contain(c.green('ok'));
  });

  it('rejects malformed returns in bounded and unbounded output without coercion', () => {
    for (const value of [null, 0, {}, Promise.resolve('no')]) {
      const formatDetail = (() => value) as unknown as t.CliFormat.Service.FormatDetail;
      for (const terminal of [true, false]) {
        expect(() =>
          Fmt.Service.format({ ...input, presentation: { formatDetail } }, {
            terminal,
            ...(terminal ? { width: 80 } : {}),
          })
        ).to.throw(TypeError, 'Cli.Fmt.Service formatDetail must return a string or undefined.');
      }
    }
  });

  it('propagates the original callback error without retry', () => {
    const cause = {};
    let count = 0;
    let caught: unknown;
    try {
      Fmt.Service.format({
        ...input,
        presentation: {
          formatDetail: () => {
            count += 1;
            throw cause;
          },
        },
      }, { terminal: false });
    } catch (error) {
      caught = error;
    }
    expect(caught).to.equal(cause);
    expect(count).to.eql(1);
  });

  it('empty collections and invalid widths do not read presentation', () => {
    const noRead = {
      ...input,
      get presentation(): never {
        throw new Error('not read');
      },
    };
    expect(Fmt.Service.formatList([], { terminal: false })).to.eql('');
    for (const width of [0, -1, NaN, Infinity, 0.5, 65_536]) {
      expect(Fmt.Service.format(noRead, { width })).to.eql('');
    }
  });

  it('keeps original navigation targets through prettification and clipping', () => {
    const href = 'http://127.0.0.1:8080/long/path?mode=dev#top';
    const service: t.CliFormat.Service.Input = {
      name: 'urls',
      status: { state: 'ready', urls: [{ href }] },
    };
    for (const width of [24, 42, 100]) {
      const raw = Fmt.Service.format(service, { width, urlHyperlinks: true });
      expect(raw).to.contain(`\x1b]8;;${new URL(href).href}\x1b\\`);
      expect(stripAnsi(raw)).to.eql(plain(service, { width }));
      expect(raw).not.to.contain('\x1b[4m');
    }
    expect(Fmt.Service.format(service, { width: 4, urlHyperlinks: true })).not.to.contain(
      '\x1b]8;;',
    );
    expect(plain({ ...service, urlDisplay: { ipv4Loopback: 'exact' } })).to.contain(href);
  });

  it('resets origin emphasis per service and keeps HTTP and WS distinct', () => {
    const service: t.CliFormat.Service.Input = {
      name: 'urls',
      status: {
        state: 'ready',
        urls: [
          { href: 'http://localhost:8080/' },
          { href: 'http://localhost:8080/next' },
          { href: 'ws://localhost:8080/' },
        ],
      },
    };
    const raw = Fmt.Service.formatList([service, service], { terminal: false });
    expect(raw.split(c.gray('http://localhost:8080')).length - 1).to.eql(2);
    expect(raw.split(c.cyan('http://localhost:')).length - 1).to.eql(2);
    expect(raw.split(c.cyan('ws://localhost:')).length - 1).to.eql(2);
  });

  it('admits service URLs independently from automatic linking and trusted detail links', () => {
    for (
      const href of [
        'relative/path',
        'file:///tmp/private',
        'http://user:secret@host/',
        'http://host/\x00hidden',
        'http://host/\x7fhidden',
        'http://host/\x85hidden',
      ]
    ) {
      for (const urlHyperlinks of [false, true]) {
        const rendered = Fmt.Service.format({
          name: 'url',
          status: { state: 'ready', urls: [{ href }] },
        }, {
          terminal: false,
          urlHyperlinks,
        });
        expect(stripAnsi(rendered)).to.contain('invalid URL');
        expect(rendered).not.to.contain(href);
        expect(rendered).not.to.contain('\x1b]8;;');
      }
    }
    for (const scheme of ['http', 'https', 'ws', 'wss', 'ftp']) {
      const href = `${scheme}://example.com/path`;
      const rendered = Fmt.Service.format({
        name: 'url',
        status: { state: 'ready', urls: [{ href }] },
      }, {
        terminal: false,
        urlHyperlinks: true,
      });
      expect(rendered.includes('\x1b]8;;')).to.eql(scheme !== 'ftp');
      expect(stripAnsi(rendered)).to.contain(href);
    }
    const link = Fmt.hyperlink('local', new URL('file:///fixture/dist.json'));
    expect(Fmt.Service.format({ ...input, presentation: { formatDetail: () => link } }, {
      terminal: false,
      urlHyperlinks: false,
    })).to.contain(link);
  });

  it('refuses aggregate source, output, and line-limit overflow rather than truncating silently', () => {
    expect(() => plain({ name: 'x'.repeat(65_536) })).to.throw(
      'finite presentation limit exceeded',
    );
    expect(() => plain({ ...input, presentation: { formatDetail: () => 'x'.repeat(65_536) } }))
      .to.throw('finite presentation limit exceeded');
    expect(() => plain({ ...input, presentation: { formatDetail: () => '\n'.repeat(4096) } }))
      .to.throw('finite presentation limit exceeded');
    const inputs = Array.from({ length: 100 }, () => ({ name: 'x'.repeat(600) }));
    expect(() => Fmt.Service.formatList(inputs, { terminal: false }))
      .to.throw('finite presentation limit exceeded');
  });
});
