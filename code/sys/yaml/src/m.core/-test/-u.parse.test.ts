import { Yaml } from '@sys/yaml/core';
import { type t, describe, expect, it } from '../../-test.ts';

type R = t.YamlParseResult<unknown>;

describe('Yaml.parse', () => {
  it('parses valid YAML → returns data, no error', () => {
    const src = `
      name: Alice
      age: 30
    `;
    const res = Yaml.parse<{ name: string; age: number }>(src);
    expect(res.data).to.eql({ name: 'Alice', age: 30 });
    expect(res.error).to.eql(undefined);
  });

  it('invalid YAML → returns error, no data', () => {
    const src = `
      name Alice
       -foo:
    `;
    const res = Yaml.parse(src);
    expect(res.data).to.eql(undefined);
    expect(res.error?.message).to.include('Failed to parse YAML');
    expect(res.error?.cause?.name).to.eql('YAMLParseError');
    expect(res.error?.cause?.message).to.include('Implicit keys need to be on a single line');
  });

  it('empty input → graceful no-data, no-error result', () => {
    const test = (input: string) => {
      const res = Yaml.parse(input);
      expect(res.data).to.eql(null);
      expect(res.error).to.eql(undefined);
    };
    test('');
    test('  ');
  });

  it('simple values', () => {
    const a = Yaml.parse('hello');
    const b = Yaml.parse('123');
    const c = Yaml.parse('true');
    const d = Yaml.parse('""');

    const assert = (res: R, expected: any) => {
      expect(res.data).to.eql(expected);
      expect(res.error).to.eql(undefined);
    };
    assert(a, 'hello');
    assert(b, 123);
    assert(c, true);
    assert(d, '');
  });

  it('array', () => {
    const src = `
      foo:
        - 1
        - two
        - { msg: three }
    `;
    const res = Yaml.parse<any>(src);
    expect(res.data.foo).to.eql([1, 'two', { msg: 'three' }]);
  });
});
