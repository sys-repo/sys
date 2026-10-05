import { describe, expect, it, Pkg, type t } from '../../-test.ts';
import { c, Cli, stripAnsi } from '../common.ts';
import {
  formatStartHeader,
  formatStartServiceBody,
  resolveStartIdentity,
} from '../u.lifecycle/u.start.ts';

describe('@sys/cell/cli start formatting', () => {
  describe('service body', () => {
    it('reserves a two-cell gutter on each side and skips unusable widths', () => {
      const widths: (number | undefined)[] = [];
      const render = (width: number | undefined) => {
        widths.push(width);
        return [c.green('service'), '  module', '    next', '┄'.repeat(width ?? 0)].join('\n');
      };

      const text = formatStartServiceBody(render, 12, false);
      const rows = text.split('\n').filter(Boolean);
      const plainRows = stripAnsi(text).split('\n').filter(Boolean);

      expect(text.startsWith('\n')).to.eql(false);
      expect(text.endsWith('\n')).to.eql(false);
      expect(widths).to.eql([8]);
      expect(plainRows).to.eql(['  service', '    module', '      next', `  ${'┄'.repeat(8)}`]);
      for (const row of rows) expect(Cli.Fmt.Text.Width.measure(row)).to.be.lessThan(12);
      for (const width of [4, 2, 0, -1, Number.NaN]) {
        expect(formatStartServiceBody(render, width, false)).to.eql('');
      }
      expect(widths).to.eql([8]);
    });

    it('leaves non-terminal output unbounded unless width is explicit', () => {
      const widths: (number | undefined)[] = [];
      const value = 'long service value '.repeat(12);
      const render = (width: number | undefined) => {
        widths.push(width);
        return value;
      };
      expect(formatStartServiceBody(render, undefined, false)).to.eql(`  ${value}`);
      formatStartServiceBody(render, 24, false);
      expect(widths).to.eql([undefined, 20]);
      for (const width of [0.5, 4.9, Infinity, NaN, -1]) {
        expect(formatStartServiceBody(render, width, false)).to.eql('');
      }
      expect(widths).to.eql([undefined, 20]);
    });

    it('preserves authored trailing LF rows without adding frame rows', () => {
      const render = () => 'title\n\n';
      expect(formatStartServiceBody(render, 24, false)).to.eql('  title\n\n');
    });
  });

  describe('identity', () => {
    it('uses the descriptor name and caller package version independently', () => {
      const named: t.Cell.Descriptor = { kind: 'cell', version: 1, name: 'sys.ui' };
      const unnamed: t.Cell.Descriptor = { kind: 'cell', version: 1 };
      const callerPkg: t.Pkg = { name: '@sys/ui', version: '0.0.39' };

      expect(resolveStartIdentity(named, callerPkg)).to.eql({
        name: 'sys.ui',
        version: '0.0.39',
      });
      expect(resolveStartIdentity(named)).to.eql({ name: 'sys.ui' });
      expect(resolveStartIdentity(unnamed, callerPkg)).to.eql({
        name: '@sys/ui',
        version: '0.0.39',
      });
      expect(resolveStartIdentity(unnamed)).to.eql(undefined);
      expect(resolveStartIdentity(unnamed, Pkg.unknown())).to.eql(undefined);
      expect(resolveStartIdentity(unnamed, { name: '   ', version: '1.0.0' })).to.eql(undefined);
      expect(resolveStartIdentity(unnamed, { name: '@sys/ui', version: '   ' })).to.eql(undefined);
      expect(resolveStartIdentity(unnamed, { name: ' <unknown> ', version: ' 0.0.0 ' })).to.eql(
        undefined,
      );
      expect(resolveStartIdentity(unnamed, { name: ' @sys/ui ', version: ' 0.0.39 ' })).to.eql(
        undefined,
      );
      expect(resolveStartIdentity(named, { name: '@sys/ui', version: '   ' })).to.eql({
        name: 'sys.ui',
      });
    });

    it('styles the Cell name and version in green', () => {
      const header = formatStartHeader({ name: 'sys.ui', version: '0.0.39' }, 80);

      expect(header).to.contain(c.bold(c.green('sys.ui')));
      expect(header).to.contain(c.dim(c.green('0.0.39')));
    });
  });
});
