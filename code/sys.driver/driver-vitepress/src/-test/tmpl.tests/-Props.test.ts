import { describe, expect, it } from '../../-test.ts';
import { Props } from '../../-tmpl/.sys/mod.ts';

describe('Props', () => {
  it('encode → decode', () => {
    const props = { foo: 123, bar: { msg: '👋 hello' } };
    const a = Props.encode(props);
    const b = Props.decode(a);
    expect(a).to.include('123,34,102,111,111,34,58,49,50,51,44,34,98,97,114,34,58');
    expect(b).to.eql(props);
  });

  describe('decode', () => {
    it('invalid input', () => {
      const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((value: any) => expect(Props.decode(value)).to.eql({}));
    });

    it('empty string', () => {
      const test = (input: string) => {
        expect(Props.decode(input)).to.eql({});
      };
      test('');
      test('  ');
    });

    it('corrupt binary', () => {
      const res = Props.decode('123,34,102,111,111,34,58');
      expect(res).to.eql({});
    });

    it('not JSON', () => {
      const res = Props.decode('foobar');
      expect(res).to.eql({});
    });
  });
});
