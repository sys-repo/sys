import { describe, expect, it } from '../../-test.ts';
import { Diagnostic } from '../m.Diagnostic.ts';

describe('Yaml.Diagnostic.fromYamlError', () => {
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
