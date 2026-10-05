import { describe, expect, it } from '../../-test.ts';
import { Hash } from '../../m.Hash/mod.ts';
import { CompositeHash } from '../mod.ts';

describe('CompositeHash.builder', () => {
  it('create → independent empty builders', () => {
    const a = CompositeHash.builder();
    const b = CompositeHash.builder();
    expect(a).to.not.equal(b);
    expect(a.digest).to.eql('');
    expect(a.parts).to.eql({});
    expect(a.length).to.eql(0);
  });

  it('initial options → populate the builder', () => {
    const hash = CompositeHash.builder({
      initial: [
        { key: 'foo', value: 1 },
        { key: 'bar', value: 2 },
      ],
    });
    expect(hash.length).to.eql(2);
    expect(hash.parts['foo']).to.eql(Hash.sha256(1));
    expect(hash.parts['bar']).to.eql(Hash.sha256(2));
  });

  it('initial array shorthand → populate the builder', () => {
    const hash = CompositeHash.builder([
      { key: 'foo', value: 1 },
      { key: 'bar', value: 2 },
    ]);
    expect(hash.length).to.eql(2);
    expect(hash.parts['foo']).to.eql(Hash.sha256(1));
    expect(hash.parts['bar']).to.eql(Hash.sha256(2));
  });

  it('algo → exposes the default or selected hash function', () => {
    const algo = () => '0x1234';
    const a = CompositeHash.builder();
    const b = CompositeHash.builder({ algo: 'sha1' });
    const c = CompositeHash.builder({ algo: 'sha256' });
    const d = CompositeHash.builder({ algo });

    expect(a.algo).to.eql('sha256');
    expect(b.algo).to.eql('sha1');
    expect(c.algo).to.eql('sha256');
    expect(d.algo).to.eql(algo);
  });

  it('add/remove → overwrite existing keys and ignore missing removals', () => {
    const hash = CompositeHash.builder();
    const b = Hash.sha256('b');
    const c = Hash.sha256('c');

    hash.add('foo', 'a').add('foo', 'b').add('bar', 'c');
    expect(hash.length).to.eql(2);
    expect(hash.parts).to.eql({ foo: b, bar: c });

    hash.remove('404').remove('foo');
    expect(hash.length).to.eql(1);
    expect(hash.parts).to.eql({ bar: c });
  });

  it('parts → returns a fresh snapshot per read', () => {
    const hash = CompositeHash.builder().add('foo', '123456');
    expect(hash.parts).to.not.equal(hash.parts);
  });

  it('toObject → returns digest and parts without builder methods', () => {
    const hash = CompositeHash.builder();
    const a = hash.toObject();
    expect(a.digest).to.eql('');
    expect(a.parts).to.eql({});

    hash.add('foo', 'a').add('bar', 'b');

    const b = hash.toObject();
    expect(b.digest).to.eql(hash.digest);
    expect(b.parts).to.eql(hash.parts);
    expect(a).not.to.have.property('add');
  });

  it('toString → returns the current digest', () => {
    const hash = CompositeHash.builder();
    expect(hash.toString()).to.eql('');

    hash.add('foo', 'a').add('bar', 'b');
    expect(hash.toString()).to.eql(hash.digest);
  });

  it('empty builder and direct empty map → retain distinct digest conventions', () => {
    expect(CompositeHash.builder().digest).to.eql('');
    expect(CompositeHash.digest({})).to.eql(Hash.sha256(''));
    expect(CompositeHash.builder('sha1').digest).to.eql('');
    expect(CompositeHash.digest({}, { algo: 'sha1' })).to.eql(Hash.sha1(''));
  });

  it('digest → hashes key-sorted constituent hashes as entries change', () => {
    const data = new Uint8Array([1, 2, 3]);
    const a = Hash.sha256('a');
    const b = Hash.sha256(data);
    const hash = CompositeHash.builder();
    expect(hash.digest).to.eql('');

    hash.add('foo', 'a');
    expect(hash.digest).to.eql(Hash.sha256(a));
    expect(hash.digest).to.eql(CompositeHash.digest(hash.parts));

    hash.add('bar', data);
    expect(hash.digest).to.eql(Hash.sha256([b, a].join('\n'))); // Sorted by key, not hash value.
    expect(hash.digest).to.eql(CompositeHash.digest(hash.parts));
    expect(hash.toString()).to.eql(hash.digest);

    hash.remove('foo').remove('bar');
    expect(hash.digest).to.eql('');
  });

  it('explicit sha256 → retains the default digest algorithm', () => {
    const a = Hash.sha256('a');
    const b = Hash.sha256('b');
    const hash = CompositeHash.builder({ algo: 'sha256' });
    expect(hash.digest).to.eql('');
    hash.add('foo', 'a').add('bar', 'b');
    expect(hash.digest).to.eql(Hash.sha256([b, a].join('\n')));
  });

  it('sha1 shorthand → uses SHA-1 for parts and aggregate', () => {
    const a = Hash.sha1('a');
    const b = Hash.sha1('b');
    const hash = CompositeHash.builder('sha1');
    expect(hash.digest).to.eql('');
    hash.add('foo', 'a').add('bar', 'b');
    expect(hash.digest).to.eql(Hash.sha1([b, a].join('\n')));
  });

  it('custom hash function → supplies the digest', () => {
    const hash = CompositeHash.builder((_value) => 'apple');
    expect(hash.digest).to.eql('');
    hash.add('foo', 'abc').add('bar', 'def');
    expect(hash.digest).to.eql('apple');
  });
});
