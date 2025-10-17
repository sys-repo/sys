import { type t, describe, expect, it } from '../../-test.ts';
import { Diagnostic } from '../m.Diagnostic.ts';

describe('Yaml.Diagnostic', () => {
  describe('Diagnostic.fromYamlError', () => {
    it('maps code → string', () => {
      const d = Diagnostic.fromYamlError({
        name: 'YAMLParseError',
        message: 'm',
        code: 123,
        pos: [0, 1],
      } as any);
      expect(d.code).to.eql('123');
    });

    it('pos → pos (zero-length allowed)', () => {
      const d = Diagnostic.fromYamlError({ name: 'YAMLParseError', message: 'm', pos: [5] } as any);
      expect(d.pos).to.eql([5, 5]);
    });

    it('linePos single → single tuple', () => {
      const d = Diagnostic.fromYamlError({
        name: 'YAMLParseError',
        message: 'm',
        pos: [0, 0],
        linePos: [{ line: 2, col: 3 }],
      } as any);
      expect(Array.isArray(d.linePos) && d.linePos!.length).to.eql(1);
    });

    it('range coerces to exact tuple', () => {
      const r = Diagnostic.fromYamlError({
        name: 'YAMLParseError',
        message: 'm',
        pos: [0, 0],
        range: [2, 4],
      } as any).range!;
      expect(r).to.eql([2, 4]);
    });

    it('range keeps nodeEnd when present', () => {
      const r = Diagnostic.fromYamlError({
        name: 'YAMLParseError',
        message: 'm',
        pos: [0, 0],
        range: [2, 4, 6],
      } as any).range!;
      expect(r).to.eql([2, 4, 6]);
    });
  });

  describe('Yaml.Diagnostic.fromYamlErrors', () => {
    it('returns [] for undefined or empty input', () => {
      expect(Diagnostic.fromYamlErrors(undefined)).to.eql([]);
      expect(Diagnostic.fromYamlErrors([])).to.eql([]);
    });

    it('maps multiple YAML errors into normalized diagnostics', () => {
      const input = [
        { name: 'YAMLParseError', message: 'first', pos: [0, 2], code: 1 },
        { name: 'YAMLParseError', message: 'second', pos: [3, 4] },
      ] as unknown as t.Yaml.Error[];

      const out = Diagnostic.fromYamlErrors(input);
      expect(out.length).to.eql(2);

      const [a, b] = out;
      expect(a.message).to.eql('first');
      expect(a.code).to.eql('1'); // coerced to string
      expect(a.pos).to.eql([0, 2]);

      expect(b.message).to.eql('second');
      expect(b.code).to.be.undefined;
      expect(b.pos).to.eql([3, 4]);
    });
  });

  describe('Yaml.Diagnostic.toYamlError', () => {
    it('converts a diagnostic → parser-style error', () => {
      const diag = {
        message: 'bad indent',
        code: 'E1',
        pos: [5, 10] as const,
      };
      const out = Diagnostic.toYamlError(diag);

      expect(out.name).to.eql('YAMLParseError');
      expect(out.message).to.eql('bad indent');
      expect(out.code).to.eql('E1');
      expect(out.pos).to.eql([5, 10]); // mutable copy
    });

    it('falls back to range when pos missing', () => {
      const diag = {
        message: 'range only',
        code: 'R1',
        range: [2, 8] as const,
      };
      const out = Diagnostic.toYamlError(diag);
      expect(out.pos).to.eql([2, 8]);
    });

    it('linePos single → expanded pair', () => {
      const diag = {
        message: 'line',
        linePos: [{ line: 1, col: 2 }] as const,
      };
      const out = Diagnostic.toYamlError(diag);
      expect(out.linePos).to.eql([
        { line: 1, col: 2 },
        { line: 1, col: 2 },
      ]);
    });

    it('linePos pair → preserved', () => {
      const diag = {
        message: 'pair',
        linePos: [
          { line: 1, col: 1 },
          { line: 2, col: 3 },
        ] as const,
      };
      const out = Diagnostic.toYamlError(diag);
      expect(out.linePos).to.eql([
        { line: 1, col: 1 },
        { line: 2, col: 3 },
      ]);
    });
  });

  describe('Yaml.Diagnostic.toYamlErrors', () => {
    it('returns [] for undefined or empty input', () => {
      expect(Diagnostic.toYamlErrors(undefined)).to.eql([]);
      expect(Diagnostic.toYamlErrors([])).to.eql([]);
    });

    it('maps list of diagnostics → parser errors', () => {
      const list = [
        { message: 'one', pos: [0, 1] },
        { message: 'two', range: [2, 3] },
      ] as t.Yaml.Error[];
      const out = Diagnostic.toYamlErrors(list);

      expect(out.length).to.eql(2);
      expect(out[0].name).to.eql('YAMLParseError');
      expect(out[0].pos).to.eql([0, 1]);
      expect(out[1].pos).to.eql([2, 3]);
    });
  });
});
