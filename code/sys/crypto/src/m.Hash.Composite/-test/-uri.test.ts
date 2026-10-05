import { describe, expect, it } from '../../-test.ts';
import { FileHashUri } from '../mod.ts';

describe('FileHashUri', () => {
  it('toUri → encodes a hash with an optional byte length', () => {
    const a = FileHashUri.toUri('sha256-0000');
    const b = FileHashUri.toUri('sha256-0000', 1234);
    expect(a).to.eql('sha256-0000');
    expect(b).to.eql('sha256-0000:size=1234');
  });

  it('fromUri: non-string input → empty hash', () => {
    const inputs = [123, true, null, {}, [], BigInt(0), Symbol()];
    for (const input of inputs) {
      // @ts-expect-error Exercise runtime refusal outside the typed string API.
      expect(FileHashUri.fromUri(input)).to.eql({ hash: '' });
    }
  });

  it('fromUri: malformed text → empty hash', () => {
    expect(FileHashUri.fromUri('')).to.eql({ hash: '' });
    expect(FileHashUri.fromUri('sha256-')).to.eql({ hash: '' });
    expect(FileHashUri.fromUri('sha256-XYZ:size=123')).to.eql({ hash: '' }); // Non-hex.
    expect(FileHashUri.fromUri('sha256-abc123:size=12three')).to.eql({ hash: '' });
    expect(FileHashUri.fromUri('totally-not-it')).to.eql({ hash: '' });
  });

  it('fromUri: hash alone → decoded hash without bytes', () => {
    expect(FileHashUri.fromUri('sha256-abcdef012345')).to.eql({
      hash: 'sha256-abcdef012345',
    });
  });

  it('fromUri: sized hash → decoded hash and byte length', () => {
    expect(FileHashUri.fromUri('sha256-abcdef012345:size=4096')).to.eql({
      hash: 'sha256-abcdef012345',
      bytes: 4096,
    });
  });
});
