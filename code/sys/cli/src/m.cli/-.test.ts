import { describe, expect, it } from '../-test.ts';
import { Args, Path } from '../common.ts';
import { c, Cli, Fmt, Keyboard, Prompt, Spinner, Table } from '@sys/cli/cli';
import { copyToClipboard } from './u.clipboard.ts';
import { Input } from './m.Input.ts';

describe('Cli', () => {
  it('API', () => {
    expect(Cli.Path).to.equal(Path);
    expect(Cli.Args).to.equal(Args);

    expect(Cli.Fmt).to.equal(Fmt);
    expect(Cli.Keyboard).to.equal(Keyboard);
    expect(Cli.Spinner).to.equal(Spinner);
    expect(Cli.Table).to.equal(Table);

    expect(Cli.Prompt).to.equal(Prompt);
    expect(Cli.Input).to.equal(Input);

    expect(Cli.args).to.equal(Args.parse);
    expect(Cli.keypress).to.equal(Keyboard.keypress);
    expect(Cli.copyToClipboard).to.equal(copyToClipboard);
  });

  it('Cli.stripAnsi', () => {
    const test = (input: string, output: string) => {
      expect(Cli.stripAnsi(input)).to.eql(output);
    };
    test('foobar', 'foobar');
    test(c.cyan('foobar'), 'foobar');
    test(`foo${c.green('bar')} baz`, 'foobar baz');
  });

  describe('Cli.Fmt', () => {
    describe('Fmt.Tree', () => {
      const T = Cli.Fmt.Tree;

      it('exports glyph primitives', () => {
        expect(T.vert).to.equal('│');
        expect(T.mid).to.equal('├');
        expect(T.last).to.equal('└');
        expect(T.bar).to.equal('─');
      });

      it('branch(boolean): mid/last + single bar', () => {
        expect(T.branch(false)).to.equal(T.mid + T.bar); // "├─"
        expect(T.branch(true)).to.equal(T.last + T.bar); // "└─"
      });

      it('branch(tuple): equivalent to boolean form', () => {
        const items = [1, 2, 3];

        expect(T.branch([0, items])).to.equal(T.mid + T.bar);
        expect(T.branch([1, items])).to.equal(T.mid + T.bar);
        expect(T.branch([2, items])).to.equal(T.last + T.bar);
      });

      it('branch extend: repeats bar', () => {
        expect(T.branch(false, 3)).to.equal(T.mid + T.bar.repeat(3));
        expect(T.branch(true, 2)).to.equal(T.last + T.bar.repeat(2));
      });
    });

    describe('Fmt.Path', () => {
      it('Path.str: gray path with white basename', () => {
        const path = 'foo/bar/a.ts';

        const inner = Fmt.path(path, Fmt.Path.fmt());
        expect(inner).to.eql(`foo/bar/${c.white('a.ts')}`);

        const res = Fmt.Path.str(path);
        expect(res).to.eql(c.gray(inner));
      });
    });
  });

  describe('Cli.table', () => {
    it('creates with/without params', () => {
      const a = Cli.table([]);
      const b = Cli.table();

      a.push(['foo', 'bar']);
      b.push(['foo', 'bar']);

      console.info(String(a).trim());
      console.info(String(b).trim());
    });
  });
});
