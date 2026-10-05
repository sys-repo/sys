import { describe, expect, it } from '../../-test.ts';
import { Hash } from '../mod.ts';

describe('Hash.toBytes', () => {
  const cases = [
    { name: 'empty text', input: '', text: '' },
    { name: 'text', input: 'hello', text: 'hello' },
    { name: 'number', input: 123, text: '123' },
    { name: 'undefined', input: undefined, text: 'undefined' },
    { name: 'null', input: null, text: 'null' },
    { name: 'true', input: true, text: 'true' },
    { name: 'false', input: false, text: 'false' },
    { name: 'bigint', input: 9999n, text: '9999' },
    { name: 'symbol', input: Symbol('foo'), text: 'Symbol(foo)' },
    { name: 'empty object', input: {}, text: '{}' },
    { name: 'string property', input: { msg: 'abc' }, text: '{"msg":"abc"}' },
    { name: 'number property', input: { foo: 123 }, text: '{"foo":123}' },
    { name: 'empty array', input: [], text: '[]' },
    { name: 'nested object', input: [1, { item: 2 }], text: '[1,{"item":2}]' },
  ];
  for (const { name, input, text } of cases) {
    it(`${name} → exact UTF-8 bytes`, () => {
      const expected = new TextEncoder().encode(text);
      expect(Hash.toBytes(input)).to.eql(expected);
    });
  }

  it('functions → their runtime text representation', () => {
    // Function source whitespace belongs to the emitter, not Hash's contract.
    const input = () => null;
    const expected = new TextEncoder().encode(String(input));
    expect(Hash.toBytes(input)).to.eql(expected);
  });

  it('Unicode → UTF-8, not code units', () => {
    const expected = new Uint8Array([0xc3, 0xa9, 0xe2, 0x9c, 0x93]);
    expect(Hash.toBytes('é✓')).to.eql(expected);
  });

  it('circular objects → compact JSON with the circular marker', () => {
    const input: { foo: number; ref?: unknown } = { foo: 123 };
    input.ref = input;
    const objectText = '{"foo":123,"ref":"[Circular]"}';
    const arrayText = '[1,{"foo":123,"ref":"[Circular]"}]';

    expect(Hash.toBytes(input)).to.eql(new TextEncoder().encode(objectText));
    expect(Hash.toBytes([1, input])).to.eql(new TextEncoder().encode(arrayText));
  });

  it('asString receives the original non-binary input and overrides JSON conversion', () => {
    const input = { msg: 'not the digest input' };
    const received: unknown[] = [];
    const actual = Hash.toBytes(input, {
      asString(value) {
        received.push(value);
        return 'é✓';
      },
    });

    expect(received.length).to.eql(1);
    expect(received[0]).to.equal(input);
    expect(actual).to.eql(new Uint8Array([0xc3, 0xa9, 0xe2, 0x9c, 0x93]));
  });

  it('binary inputs bypass asString and preserve the selected byte range', () => {
    const input = new Uint8Array([0, 255, 128, 1, 2, 3]);
    const expected = new Uint8Array([0, 255, 128, 1, 2, 3]);
    const view = new Uint8Array([9, 0, 255, 128, 1, 2, 3, 9]).subarray(1, 7);
    const asString = () => {
      throw new Error('Binary input must not invoke asString');
    };

    expect(Hash.toBytes(input, { asString })).to.eql(expected);
    expect(Hash.toBytes(input.buffer, { asString })).to.eql(expected);
    expect(Hash.toBytes(view, { asString })).to.eql(expected);
  });
});

describe('Hash.toHex', () => {
  it('empty bytes → empty text', () => {
    expect(Hash.toHex(new Uint8Array())).to.eql('');
  });

  it('preserves byte order, leading zeros, and lowercase hex digits', () => {
    const bytes = new Uint8Array([0, 1, 15, 16, 128, 255]);
    expect(Hash.toHex(bytes)).to.eql('00010f1080ff');
  });
});
