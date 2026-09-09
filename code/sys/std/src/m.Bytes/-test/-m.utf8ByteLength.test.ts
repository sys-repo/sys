import { describe, expect, it } from '../../-test.ts';
import { Bytes, utf8ByteLength } from '../mod.ts';

describe('Bytes.utf8ByteLength', () => {
  it('measures bytes under UTF-8 encoding, not UTF-16 string length', () => {
    expect(utf8ByteLength('')).to.eql(0);
    expect(utf8ByteLength('abc')).to.eql(3);
    expect(utf8ByteLength('\0')).to.eql(1);
    expect(utf8ByteLength('é')).to.eql(2);
    expect(utf8ByteLength('€')).to.eql(3);
    expect(utf8ByteLength('🙂')).to.eql(4);
    expect(utf8ByteLength('a\n🙂')).to.eql(6);
  });

  it('uses Encoding Standard replacement semantics for surrogate edge-cases', () => {
    expect('�'.length).to.eql(1);
    expect('\uD800'.length).to.eql(1);
    expect('\uDC00'.length).to.eql(1);
    expect('🙂'.length).to.eql(2);
    expect(utf8ByteLength('\uD800')).to.eql(3);
    expect(utf8ByteLength('\uDC00')).to.eql(3);
    expect(utf8ByteLength('\uD800a')).to.eql(4);
    expect(utf8ByteLength('\uD83D\uDE42')).to.eql(4);
  });

  it('matches the platform UTF-8 encoder for representative scalar classes', () => {
    const encoder = new TextEncoder();
    const samples = ['', 'abc', '\0', 'é', '€', '水', '🙂', 'a\n🙂', '\uD800', '\uDC00'];

    for (const sample of samples) {
      expect(utf8ByteLength(sample)).to.eql(encoder.encode(sample).byteLength);
    }
  });

  it('is exposed on the Bytes namespace', () => {
    expect(Bytes.utf8ByteLength('🙂')).to.eql(4);
  });
});
