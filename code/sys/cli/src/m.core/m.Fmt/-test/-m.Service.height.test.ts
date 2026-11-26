import { describe, expect, it, Str, type t } from '../../../-test.ts';
import { Fmt, stripAnsi } from '../../mod.ts';
import { formatListWith } from '../m/m.Service.ts';
import type { composeServiceText, ServiceTextPart } from '../u.service/u.layout.ts';

const services: t.CliFormat.Service.Input[] = ['A', 'B'].map((name) => ({
  name,
  module: `module-${name}`,
  status: { state: 'ready', urls: [{ href: `https://${name.toLowerCase()}.test/` }] },
}));

const render = (maxRows?: number) =>
  Fmt.Service.formatList(services, { width: 44, urlHyperlinks: true, maxRows });

describe('Cli.Fmt.Service height', () => {
  it('keeps service identities before access URLs, and access URLs before details', () => {
    const full = render();
    const [a, moduleA, urlA, rule, b, moduleB, urlB] = full.split('\n');
    expect(stripAnsi(a)).to.eql('service   A');
    expect(stripAnsi(b)).to.eql('service   B');
    expect(urlA).to.include('\x1b]8;;https://a.test/');
    expect(urlB).to.include('\x1b]8;;https://b.test/');
    const expected = [
      [],
      [a + Fmt.omission(' +1 more')],
      [a, b],
      [a, urlA, b],
      [a, urlA, b, urlB],
      [a, moduleA, urlA, b, urlB],
      [a, moduleA, urlA, b, moduleB, urlB],
      [a, moduleA, urlA, rule, b, moduleB, urlB],
    ];
    const budgets = [...expected.entries()];
    expect(render(budgets.length)).to.eql(full);
    for (const [maxRows, lines] of [...budgets.toReversed(), ...budgets]) {
      const text = render(maxRows);
      expect(text).to.eql(lines.join('\n'));
      for (const line of text.split('\n')) expect(Fmt.Text.Width.measure(line)).to.be.at.most(44);
    }
  });

  it('chooses the limit from one fit, counting authored lines but not dividers', () => {
    let detailCalls = 0;
    const inputs: t.CliFormat.Service.Input[] = [
      {
        name: 'A',
        status: { state: 'ready', details: [{ label: 'detail', value: 'plain' }] },
        presentation: {
          formatDetail() {
            detailCalls += 1;
            return 'one\n\nthree';
          },
        },
      },
      { name: 'B' },
    ];
    const counts: number[] = [];
    const text = Fmt.Service.formatList(inputs, {
      width: 40,
      maxRows(count) {
        counts.push(count);
        return count - 1;
      },
    });
    expect(counts).to.eql([5]);
    expect(detailCalls).to.eql(1);
    expect(text).to.eql(Fmt.Service.formatList(inputs, { width: 40, maxRows: 4 }));
  });

  it('promotes the first valid URL, not the first clickable or URL-looking field', () => {
    const href = 'https://example.test/long/path/with/query?q=a#top';
    const inputs: t.CliFormat.Service.Input[] = [
      {
        name: 'A',
        status: {
          state: 'ready',
          urls: [{ href: 'not a url' }, { href: 'ftp://files.test/' }, { href }],
        },
      },
      {
        name: 'B',
        status: { state: 'ready', details: [{ label: 'url', value: 'https://detail.test/' }] },
      },
    ];
    const render = (maxRows?: number) =>
      Fmt.Service.formatList(inputs, { width: 32, maxRows, urlHyperlinks: true });
    const full = render();
    expect(render(7)).to.eql(full);
    expect(stripAnsi(full)).to.include('invalid URL');
    const four = render(4);
    expect(four).to.include(`\x1b]8;;${href}\x1b\\`);
    expect(four).not.to.include('invalid URL');
    expect(stripAnsi(four).split('\n')[1]).to.match(/^ url +ftp:\/\/files\.test\/$/);
    const three = render(3);
    expect(stripAnsi(three)).to.eql(Str.dedent(`
      service   A
       url      ftp://files.test/
      service   B
    `));
    expect(three).not.to.include('\x1b]8;;');
    expect(stripAnsi(render(2))).to.eql(Str.dedent(`
      service   A
      service   B
    `));
  });

  it('marks the URL in the gap, even when height compaction restores its label', () => {
    const href = 'http://127.0.0.1:8080/';
    const input: t.CliFormat.Service.Input = {
      name: 'A',
      status: { state: 'ready', urls: [{ href: 'invalid' }, { href: href.slice(0, -1) }] },
    };
    const marked = {
      ...input,
      urlDisplay: { ipv4Loopback: 'localhost' as const, mark: (url: string) => url === href },
    };
    const render = (input: t.CliFormat.Service.Input, width: number, maxRows: number) =>
      Fmt.Service.format(input, { width, maxRows, urlHyperlinks: true });
    const opener = `\x1b]8;;${href}\x1b\\`;
    for (const [width, maxRows] of [[50, 3], [16, 2]] as const) {
      const urlRow = (input: t.CliFormat.Service.Input) => {
        const line = render(input, width, maxRows).split('\n').at(-1)!;
        return line.split(opener).map(stripAnsi);
      };
      const [prefix, label] = urlRow(input);
      expect(urlRow(marked)).to.eql([`${prefix.slice(0, -2)}⦿ `, label]);
    }
    // Width 3 has no gap; at width 4 the value fits only the omission marker.
    for (const width of [3, 4]) expect(render(marked, width, 2)).to.eql(render(input, width, 2));
  });

  it('drops suffix lines of either column without mistaking authored blanks for spacing', () => {
    const inputs: t.CliFormat.Service.Input[] = [
      {
        name: 'A\nname-tail',
        status: {
          state: 'ready',
          details: [{ label: 'long\n\nlabel-tail', value: 'value' }],
        },
      },
      { name: 'B' },
    ];
    const render = (maxRows?: number) => Fmt.Service.formatList(inputs, { width: 40, maxRows });
    const [a, nameTail, field, blank, labelTail, , b] = render().split('\n');
    expect(stripAnsi(blank).trim()).to.eql('');
    expect(stripAnsi(labelTail).trim()).to.eql('label-tail');
    const optional = [nameTail, field, blank, labelTail];
    for (let keep = 0; keep <= optional.length; keep++) {
      expect(render(2 + keep)).to.eql([a, ...optional.slice(0, keep), b].join('\n'));
    }
  });

  it('keeps captured error state ahead of annotation and hidden-service count', () => {
    const a: t.CliFormat.Service.Input = {
      name: 'Alpha',
      annotation: '--mode=dev',
      status: {
        state: 'error',
        error: { name: 'Error', message: 'offline' },
        details: [{ label: 'error', value: 'custom' }],
      },
    };
    const render = (width: number, maxRows: number) =>
      stripAnsi(Fmt.Service.formatList([a, { name: 'B' }], { width, maxRows }));
    expect(render(50, 3)).to.match(/^service +Alpha --mode=dev\n state +error\nservice +B$/);
    expect(render(50, 1)).to.match(/Alpha --mode=dev error \+1 more$/);
    expect(render(21, 1)).to.match(/Alpha error$/);
    expect(render(8, 1)).to.match(/A…!$/);
    expect(render(3, 1)).to.match(/A!$/);
    expect(render(1, 1)).to.eql('!');
    const wideName = { name: '東京', status: { state: 'error' } } as const;
    const tiny = Fmt.Service.format(wideName, { width: 3, maxRows: 1 });
    expect(stripAnsi(tiny)).to.eql('…!'); // One label cell; neither name glyph fits.
    a.status = { state: 'ready', details: [{ label: 'error', value: 'custom' }] };
    expect(render(21, 2)).not.to.match(/error|!/);
    expect(render(15, 1)).not.to.include('+1 more');
  });

  it('compact error title → only the inserted ellipsis is an omission', () => {
    const input: t.CliFormat.Service.Input = { name: 'abcdefghij', status: { state: 'error' } };
    const options = { width: 18, maxRows: 1 };
    const output = Fmt.Service.format(input, options);
    expect(stripAnsi(output)).to.eql('service   abc…hij!');
    expect(output).to.include(Fmt.omission());

    // Make the dim marker observable even when terminal colors are disabled.
    const mark = ({ text, color }: ServiceTextPart) => color === 'dim' && text === '…' ? '·' : text;
    const text: typeof composeServiceText = (parts) => parts.map(mark).join('');
    const deps = { text, terminal: () => false, size: () => ({ width: 18, height: 1 }) };
    const literal = { ...input, name: 'a…cdefghij' };
    expect(formatListWith(deps, [literal], options)).to.eql('service   a…c·hij!');
  });

  it('normalizes explicit row limits without coercion', () => {
    expect(render(2.9)).to.eql(render(2));
    expect(render(Number.MAX_VALUE)).to.eql(render());
    for (const limit of [-1, NaN, Infinity]) expect(render(limit)).to.eql('');
  });
});
