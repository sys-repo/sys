import { describe, expect, it, type t } from '../../../-test.ts';
import { Fmt } from '../mod.ts';
import { c, stripAnsi } from '../common.ts';
import { displayPath } from '../m/m.Path.ts';
import { formatListWith, physicalLines } from '../m/m.Service.ts';
import { encodeHyperlink } from '../u/u.hyperlink.ts';
import { composeServiceText, fitServiceText } from '../u.service/u.layout.ts';
import { composeUrlPart, parts } from '../u.service/u.url.prepare.ts';

const renderDeps = { terminal: () => false, size: () => ({ width: 80, height: 24 }) };

const input: t.CliFormat.Service.Input = {
  name: 'example',
  status: { state: 'ready', root: '/root', details: [{ label: 'detail', value: 'plain' }] },
};

describe('Cli.Fmt.Service capture and authority boundaries', () => {
  it('resolves terminal and screen once per collection, including paths', () => {
    let probes = 0;
    let measures = 0;
    const deps = {
      terminal: () => {
        probes += 1;
        return true;
      },
      size: () => {
        measures += 1;
        return { width: 40, height: 24 };
      },
    };
    formatListWith(deps, [input, input]);
    expect({ probes, measures }).to.eql({ probes: 1, measures: 1 });
    formatListWith(deps, [input], { width: 80 });
    formatListWith(deps, [input], { terminal: false });
    expect({ probes, measures }).to.eql({ probes: 1, measures: 1 });
    formatListWith(deps, [input], { terminal: true });
    expect({ probes, measures }).to.eql({ probes: 1, measures: 2 });
  });

  it('does not replace an invalid measured viewport with an 80-cell fallback', () => {
    const deps = { terminal: () => true, size: () => ({ width: NaN, height: 24 }) };
    expect(formatListWith(deps, [input])).to.eql('');
  });

  it('refuses malformed collection lengths and facts without coercion or traversal', () => {
    let coerced = 0;
    let indexed = 0;
    const hostile = { valueOf: () => ++coerced, toString: () => `${++coerced}` };
    for (const length of [NaN, Infinity, -1, 0.5, '1', hostile]) {
      const inputs = new Proxy([input], {
        get(target, key, receiver) {
          if (key === 'length') return length;
          indexed += 1;
          return Reflect.get(target, key, receiver);
        },
      });
      expect(() => Fmt.Service.formatList(inputs, { terminal: false })).to.throw(TypeError);
    }
    expect(() => Fmt.Service.format({ name: hostile as unknown as string })).to.throw(TypeError);
    expect({ coerced, indexed }).to.eql({ coerced: 0, indexed: 0 });
  });

  it('physical-line admission → accepts 4,096 lines and refuses overflow before splitting', () => {
    let calls = 0;
    const split = (text: string) => {
      calls += 1;
      return text.split('\n');
    };
    // LF bytes, including trailing blanks, define the physical collection rather than rendered cells.
    expect(physicalLines('', { split })).to.eql(['']);
    expect(physicalLines('a\r\nb\n', { split })).to.eql(['a\r', 'b', '']);
    expect(physicalLines('\n'.repeat(4095), { split })).to.have.length(4096);
    expect(calls).to.eql(3);
    for (const count of [4096, 65_535]) {
      calls = 0;
      const admit = () => physicalLines('\n'.repeat(count), { split });
      expect(admit).to.throw('finite presentation limit exceeded');
      expect(calls).to.eql(0);
    }
  });

  it('cumulative label admission → refuses the next measurement collection before splitting', () => {
    let calls = 0;
    const split = (text: string) => {
      calls += 1;
      return text.split('\n');
    };
    const exact = physicalLines('\n'.repeat(4094), { previous: 1, split });
    expect(exact).to.have.length(4095);
    expect(calls).to.eql(1);
    for (const [previous, text] of [[1, '\n'.repeat(4095)], [4096, '']] as const) {
      calls = 0;
      const admit = () => physicalLines(text, { previous, split });
      expect(admit).to.throw('finite presentation limit exceeded');
      expect(calls).to.eql(0);
    }
  });

  it('labels, plain values and rich results → preserve the exact physical output ceiling', () => {
    const cases: readonly ((value: string) => t.CliFormat.Service.Input)[] = [
      (name) => ({ name }),
      (label) => ({ name: '', status: { state: 'ready', details: [{ label, value: '' }] } }),
      (value) => ({ name: '', status: { state: 'ready', details: [{ label: '', value }] } }),
      (value) => ({
        name: '',
        status: { state: 'ready', details: [{ label: '', value: '' }] },
        presentation: { formatDetail: () => value },
      }),
    ];
    for (const [index, input] of cases.entries()) {
      const render = (lines: number) => {
        return Fmt.Service.format(input('\n'.repeat(lines - 1)), { width: 1 });
      };
      const exact = index === 0 ? 4096 : 4095; // Detail rows share the output with the service title.
      expect(render(exact).split('\n')).to.have.length(4096);
      expect(() => render(exact + 1)).to.throw('finite presentation limit exceeded');
      expect(() => render(4097)).to.throw('finite presentation limit exceeded');
    }
  });

  it('styled label overflow → refuses before invoking its value callback', () => {
    let calls = 0;
    const input: t.CliFormat.Service.Input = {
      name: 'example',
      status: {
        state: 'ready',
        details: [{ label: 'x\n'.repeat(4094) + 'x', value: '' }],
      },
      presentation: {
        formatDetail() {
          calls += 1;
          return undefined;
        },
      },
    };
    const render = () => Fmt.Service.format(input, { terminal: false });
    expect(render).to.throw('finite presentation limit exceeded');
    expect(calls).to.eql(0);
  });

  it('aggregate label overflow → refuses before collecting subsequent service facts', () => {
    let reads = 0;
    const service: t.CliFormat.Service.Input = {
      name: 'example',
      status: {
        state: 'ready',
        details: [{ label: 'x\n'.repeat(4094) + 'x', value: '' }],
      },
    };
    const next = {
      ...service,
      get module() {
        reads += 1;
        return 'not collected';
      },
    };
    const render = () => Fmt.Service.formatList([service, next], { terminal: false });
    expect(render).to.throw('finite presentation limit exceeded');
    expect(reads).to.eql(0);
  });

  it('admits exact output and physical-line ceilings without double-counting columns', () => {
    const service: t.CliFormat.Service.Input = {
      name: 'example',
      status: { state: 'ready', details: [{ label: 'x', value: '' }] },
    };
    // Edge LF bytes keep two blank value continuations; table padding also consumes the envelope.
    const render = (value: string) =>
      Fmt.Service.format({
        ...service,
        presentation: { formatDetail: () => value },
      }, { terminal: false });
    const remaining = 65_535 - render('\n\n').length;
    expect(render('x'.repeat(remaining) + '\n\n').length).to.eql(65_535);
    const overflow = () => render('x'.repeat(remaining + 1) + '\n\n');
    expect(overflow).to.throw('finite presentation limit exceeded');

    const lines = (count: number) =>
      Fmt.Service.format({
        ...service,
        presentation: { formatDetail: () => '\n'.repeat(count - 1) },
      }, { width: 1 });
    expect(lines(4095).split('\n').length).to.eql(4096);
    expect(() => lines(4096)).to.throw('finite presentation limit exceeded');
  });

  it('separator overflow → refuses before constructing the rule', () => {
    const cases = [
      { width: 65_535, name: 'a' },
      { width: 40_000, name: 'x'.repeat(20_000) },
    ];
    for (const { width, name } of cases) {
      let calls = 0;
      const deps = {
        ...renderDeps,
        hr(options: t.CliFormat.Hr.Options) {
          calls += 1;
          return Fmt.hr(options);
        },
      };
      const render = () => formatListWith(deps, [{ name }, { name }], { width });

      expect(render).to.throw('finite presentation limit exceeded');
      expect(calls).to.eql(0);
    }
  });

  it('encoded link overflow → refuses before constructing the hyperlink', () => {
    const cases = [
      { name: 'a', href: `https://example.test/${'x'.repeat(40_000)}` },
      { name: 'x'.repeat(64_000), href: `https://example.test/${'x'.repeat(1_000)}` },
    ];
    for (const { name, href } of cases) {
      let calls = 0;
      const deps = {
        ...renderDeps,
        hyperlink(label: string, href: string) {
          calls += 1;
          return encodeHyperlink(label, href);
        },
      };
      const status: t.Service.Status = { state: 'ready', urls: [{ href }] };
      const render = () => {
        return formatListWith(deps, [{ name, status }], { terminal: false, urlHyperlinks: true });
      };

      expect(render).to.throw('finite presentation limit exceeded');
      expect(calls).to.eql(0);
    }
  });

  it('long URL → admits an unlinked label or a clipped link to the full target', () => {
    const href = `http://127.0.0.1:8080/${'x'.repeat(40_000)}`;
    const service: t.CliFormat.Service.Input = {
      name: 'a',
      status: { state: 'ready', urls: [{ href }] },
    };
    const plain = Fmt.Service.format(service, { terminal: false });
    expect(plain).not.to.contain('\x1b]8;;');
    expect(plain.length).to.be.lessThan(65_535);
    expect(plain).to.contain('x'.repeat(40_000));

    const linked = Fmt.Service.format(service, { width: 36, urlHyperlinks: true });
    expect(linked).to.contain(`\x1b]8;;${href}\x1b\\`);
    expect(linked).to.contain(Fmt.omission());
    expect(linked.length).to.be.lessThan(65_535);
    for (const line of linked.split('\n')) expect(Fmt.Text.Width.measure(line)).to.be.at.most(36);
  });

  it('separator framing and repetition → admits exactly 65,535 code units', () => {
    for (const count of [2, 3]) {
      let calls = 0;
      const deps = {
        ...renderDeps,
        hr(options: t.CliFormat.Hr.Options) {
          calls += 1;
          return Fmt.hr(options);
        },
      };
      const tail = Array.from({ length: count - 1 }, () => ({ name: 'a' }));
      const render = (width: number, suffix = '') => {
        return formatListWith(deps, [{ name: `a${suffix}` }, ...tail], { width });
      };
      const remaining = 65_535 - render(100).length;
      const width = 100 + Math.floor(remaining / (count - 1));
      const suffix = 'x'.repeat(remaining % (count - 1));
      calls = 0;

      expect(render(width, suffix).length).to.eql(65_535);
      expect(calls).to.eql(1);
      calls = 0;
      expect(() => render(width, `${suffix}x`)).to.throw('finite presentation limit exceeded');
      expect(calls).to.eql(0);
    }
  });

  it('separator physical lines → admits 4,096 and refuses before composing line 4,097', () => {
    let calls = 0;
    const deps = {
      ...renderDeps,
      hr(options: t.CliFormat.Hr.Options) {
        calls += 1;
        return Fmt.hr(options);
      },
    };
    const render = (count: number) => {
      const service: t.CliFormat.Service.Input = {
        name: '',
        status: { state: 'ready', details: [{ label: '', value: '' }] },
        presentation: { formatDetail: () => '\n'.repeat(count - 1) },
      };
      return formatListWith(deps, [service, { name: '' }], { width: 1 });
    };

    expect(render(4093).split('\n').length).to.eql(4096);
    expect(calls).to.eql(1);
    calls = 0;
    expect(() => render(4094)).to.throw('finite presentation limit exceeded');
    expect(calls).to.eql(0);
  });

  it('encoded targets and repeated links → admits exactly 65,535 code units', () => {
    const href = 'https://example.test/é space?q=界#résumé';
    for (const count of [1, 2]) {
      let calls = 0;
      const deps = {
        ...renderDeps,
        hyperlink(label: string, href: string) {
          calls += 1;
          return encodeHyperlink(label, href);
        },
      };
      const urls = Array.from({ length: count }, () => ({ href }));
      const status: t.Service.Status = { state: 'ready', urls };
      const render = (name: string) => {
        return formatListWith(deps, [{ name, status }], { terminal: false, urlHyperlinks: true });
      };
      const name = 'x'.repeat(65_535 - render('x').length + 1);
      calls = 0;
      const result = render(name);

      expect(result.length).to.eql(65_535);
      expect(result).to.contain(`\x1b]8;;${new URL(href).href}\x1b\\`);
      expect(calls).to.eql(count);
      calls = 0;
      expect(() => render(`${name}x`)).to.throw('finite presentation limit exceeded');
      expect(calls).to.eql(count - 1);
    }
  });

  it('indented label measurement → refuses aggregate overflow before reading later facts', () => {
    let reads = 0;
    const input: t.CliFormat.Service.Input = {
      name: '',
      status: {
        state: 'ready',
        details: [{ label: 'x'.repeat(65_529), value: '' }],
        get error() {
          reads += 1;
          return undefined;
        },
      },
    };
    const render = () => Fmt.Service.format(input, { terminal: false });
    expect(render).to.throw('finite presentation limit exceeded');
    expect(reads).to.eql(0);
  });

  it('styled title ceiling → refuses before composing ANSI output', () => {
    let calls = 0;
    const deps = {
      ...renderDeps,
      text(...args: Parameters<typeof composeServiceText>) {
        if (args[0].some(({ text }) => text.length > 1000)) calls += 1;
        return composeServiceText(...args);
      },
    };
    const input = { name: 'x'.repeat(65_535) };
    const render = () => formatListWith(deps, [input]);
    expect(render).to.throw('finite presentation limit exceeded');
    expect(calls).to.eql(0);
  });

  it('styled row families → admit exact output and refuse one-over before composition', () => {
    const cases: readonly ((value: string) => t.CliFormat.Service.Input)[] = [
      (name) => ({ name }),
      (annotation) => ({ name: 'a', annotation }),
      (module) => ({ name: 'a', module }),
      // Runtime strings still require finite admission, even outside the typed state vocabulary.
      (state) => ({ name: 'a', status: { state } } as t.CliFormat.Service.Input),
      (root) => ({ name: 'a', status: { state: 'ready', root: `/${root}` } }),
      (value) => ({ name: 'a', status: { state: 'ready', details: [{ label: 'x', value }] } }),
      (message) => ({ name: 'a', status: { state: 'error', error: { name: 'Error', message } } }),
      (path) => {
        const urls = [{ href: `https://example.test/${path}` }];
        return { name: 'a', status: { state: 'ready', urls } };
      },
      (open) => ({ name: 'a', keyboard: { open } }),
    ];
    const calls: number[] = [];
    for (const input of cases) {
      let composed = 0;
      const deps = {
        ...renderDeps,
        text(...args: Parameters<typeof composeServiceText>) {
          if (args[0].some(({ text }) => text.includes('X'))) composed += 1;
          return composeServiceText(...args);
        },
      };
      const render = (value: string) => formatListWith(deps, [input(value)]);
      const count = 65_535 - render('X').length + 1;
      expect(render('X'.repeat(count)).length).to.eql(65_535);
      composed = 0;
      expect(() => render('X'.repeat(count + 1))).to.throw('finite presentation limit exceeded');
      calls.push(composed);
    }
    expect(calls).to.eql(cases.map(() => 0));
  });

  it('styled fitting → preflight agrees with active framing, resets, clipping and underlining', () => {
    // These SGR bytes specifically exercise dim/underline close-code rewriting during styling.
    const text = 'ab\x1b[22mcd\x1b[24mef\x1b[39mgh';
    for (const color of ['gray', 'dim', 'annotation', 'port'] as const) {
      for (const width of [undefined, 5]) {
        for (const underline of [false, true]) {
          let admitted: number | undefined;
          const result = fitServiceText(text, width, {
            color,
            underline,
            check(length) {
              admitted = length;
            },
          });
          expect(admitted).to.eql(result.length);
        }
      }
    }
  });

  it('dense ANSI resets → preserve nested and underline peak sizing', () => {
    const text = '\x1b[22m\x1b[24m'.repeat(4097) + 'x';
    const cases = [['dim', c.gray], ['annotation', c.cyan], ['port', c.cyan]] as const;
    for (const [color, inner] of cases) {
      for (const underline of [false, true]) {
        const parts = [{ text, color }];
        const expected = composeServiceText(parts, underline);
        const peak = Math.max(inner(text).length, composeServiceText(parts, false).length);
        let admitted = 0;
        const result = fitServiceText(text, undefined, {
          color,
          underline,
          check(length) {
            admitted = length;
          },
        });
        expect(result).to.eql(expected);
        expect(admitted).to.eql(Math.max(peak, expected.length));
      }
    }
  });

  it('nested styles → admits their peak before an outer reset shortens the result', () => {
    const text = c.dim('x').repeat(100);
    const parts = [{ text, color: 'annotation' }] as const;
    const finalLength = composeServiceText(parts, false).length;
    let calls = 0;
    const options = {
      color: 'annotation' as const,
      check(length: number) {
        if (length > finalLength) throw new Error('test remaining budget');
      },
      compose(...args: Parameters<typeof composeServiceText>) {
        calls += 1;
        return composeServiceText(...args);
      },
    };
    const render = () => fitServiceText(text, undefined, options);
    expect(render).to.throw('test remaining budget');
    expect(calls).to.eql(0);
  });

  it('plain root projection → preserves Path display without throwaway ANSI composition', () => {
    const paths = ['', '.', ' foo//bar/ ', './a', '../a', '/a', c.cyan('/styled/root')];
    for (const root of paths) {
      const plain = stripAnsi(displayPath(root, { relative: 'bare' }));
      const styled = Fmt.Path.str(root, { relative: 'bare', highlightBasename: false });
      const input = { name: 'a', status: { state: 'ready', root } } as const;
      const result = Fmt.Service.format(input, { terminal: false });
      expect(plain).to.eql(stripAnsi(styled));
      expect(result).to.contain(c.underline(c.gray(plain)));
    }
  });

  it('encoded URL preparation → refuses individual and aggregate overflow before composition', () => {
    for (const count of [1, 2]) {
      let calls = 0;
      const deps = {
        ...renderDeps,
        url(...args: Parameters<typeof composeUrlPart>) {
          calls += 1;
          return composeUrlPart(...args);
        },
      };
      const href = `https://example.test/${'界'.repeat(8000 / count)}`;
      const urls = Array.from({ length: count }, () => ({ href }));
      const input = { name: 'a', status: { state: 'ready', urls } } as const;
      expect(() => formatListWith(deps, [input])).to.throw('finite presentation limit exceeded');
      expect(calls).to.eql(count - 1);
    }
  });

  it('URL preparation ceiling → exact admission without changing standalone ServiceUrl', () => {
    const prefix = `https://example.test/${'界'.repeat(7000)}`;
    const href = prefix + 'x'.repeat(65_535 - new URL(prefix).href.length);
    let calls = 0;
    const admission = {
      check(length: number) {
        if (length > 65_535) throw new Error('test preparation limit');
      },
      compose(...args: Parameters<typeof composeUrlPart>) {
        calls += 1;
        return composeUrlPart(...args);
      },
    };
    expect(parts([{ href }], {}, admission)[0].display.length).to.eql(65_535);
    expect(calls).to.eql(1);
    calls = 0;
    expect(() => parts([{ href: `${href}x` }], {}, admission)).to.throw('test preparation limit');
    expect(calls).to.eql(0);
    expect(Fmt.ServiceUrl.parts([{ href: `${href}x` }])[0].display.length).to.eql(65_536);
  });

  it('uses one captured function for all details despite presentation mutation', () => {
    let calls = 0;
    const presentation: { formatDetail: t.CliFormat.Service.FormatDetail } = {
      formatDetail() {
        calls += 1;
        presentation.formatDetail = () => {
          throw new Error('replacement invoked');
        };
        return undefined;
      },
    };
    Fmt.Service.format({
      ...input,
      status: {
        state: 'ready',
        details: [{ label: 'one', value: 'a' }, { label: 'two', value: 'b' }],
      },
      presentation,
    }, { terminal: false });
    expect(calls).to.eql(2);
  });

  it('propagates presentation getter errors and refuses malformed capabilities', () => {
    const cause = new Error('getter failure');
    const throwing = {
      ...input,
      get presentation(): never {
        throw cause;
      },
    };
    const render = () => Fmt.Service.format(throwing, { terminal: false });
    expect(render).to.throw(cause);
    for (const value of [null, 12, { formatDetail: 12 }]) {
      const presentation = value as unknown as t.CliFormat.Service.Presentation;
      const render = () => Fmt.Service.format({ ...input, presentation }, { terminal: false });
      expect(render).to.throw(TypeError);
    }
    const absent = {
      name: 'no details',
      get presentation(): never {
        throw cause;
      },
    };
    expect(Fmt.Service.format(absent, { terminal: false })).to.contain('no details');
  });

  it('retains annotation styling in clipped source fragments without parsing names', () => {
    const raw = Fmt.Service.format({ name: 'long-name', annotation: '--mode=dev' }, { width: 24 });
    expect(raw).to.contain(Fmt.omission());
    expect(raw).to.contain('\x1b[36m');
    const literal = Fmt.Service.format({ name: 'long-name --mode=dev' }, { width: 24 });
    expect(literal).not.to.contain('\x1b[36m');
  });

  it('refuses altered presentation authority before dispatching changed methods', () => {
    const define = Object.defineProperty;
    const descriptor = Object.getOwnPropertyDescriptor(Set.prototype, 'add')!;
    let calls = 0;
    let cause: unknown;
    define(Set.prototype, 'add', {
      ...descriptor,
      value: () => {
        calls += 1;
        throw new Error('poison');
      },
    });
    try {
      Fmt.Service.format(input);
    } catch (error) {
      cause = error;
    } finally {
      define(Set.prototype, 'add', descriptor);
    }
    expect(calls).to.eql(0);
    expect(cause).to.be.instanceOf(Error);
    expect(String(cause)).to.contain('presentation authority unavailable');
  });

  it('re-admits after a callback before touching its rich value or later rows', () => {
    const define = Object.defineProperty;
    const descriptor = Object.getOwnPropertyDescriptor(String.prototype, 'split')!;
    let calls = 0;
    let cause: unknown;
    try {
      Fmt.Service.format({
        ...input,
        presentation: {
          formatDetail() {
            define(String.prototype, 'split', {
              ...descriptor,
              value: () => {
                calls += 1;
                throw new Error('poison');
              },
            });
            return 'rich';
          },
        },
      }, { terminal: false });
    } catch (error) {
      cause = error;
    } finally {
      define(String.prototype, 'split', descriptor);
    }
    expect(calls).to.eql(0);
    expect(String(cause)).to.contain('presentation authority unavailable');
  });
});
