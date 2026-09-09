import { Bytes, describe, expect, it } from '../../-test.ts';
import { utf8ByteLength } from '../u/u.bytes.ts';

describe('Files/u.bytes', () => {
  it('delegates primitive byte-length truth to @sys/std/bytes', () => {
    expect(utf8ByteLength).to.equal(Bytes.utf8ByteLength);
  });

  it('measures canonical UTF-8 byte length, not UTF-16 string length', () => {
    expect(utf8ByteLength('')).to.eql(0);
    expect(utf8ByteLength('abc')).to.eql(3);
    expect(utf8ByteLength('é')).to.eql(2);
    expect(utf8ByteLength('🙂')).to.eql(4);
    expect(utf8ByteLength('a\n🙂')).to.eql(6);
  });
});
