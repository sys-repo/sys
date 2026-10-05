import { describe, expect, Is, it, Json, type t } from '../../-test.ts';
import { Hash } from '../../m.Hash/mod.ts';
import { CompositeHash } from '../mod.ts';

describe('CompositeHash.builder own-key preservation', () => {
  for (const key of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
    it(`${key} → collection, snapshots and digest invalidation`, () => {
      const a = new Uint8Array([1, 2]);
      const b = new Uint8Array([3]);
      const c = new Uint8Array([4, 5, 6]);
      const ah = Hash.sha256(a);
      const bh = Hash.sha256(b);
      const ch = Hash.sha256(c);
      const hash = CompositeHash.builder({
        initial: [{ key, value: a }, { key: 'z.txt', value: b }],
      });
      // Each tested key sorts before z.txt; derive the preimage without the builder/digest.
      const expectedDigest = Hash.sha256(`${ah}\n${bh}`);
      const before = hash.toObject();
      const snapshot: t.DeepMutable<t.CompositeHashParts> = hash.parts;
      expect(hash.length).to.eql(2);
      expect(hash.digest).to.eql(expectedDigest);
      expect(hash.digest).to.eql(expectedDigest); // Read the cached value too.
      expect(Object.keys(snapshot).sort()).to.eql([key, 'z.txt']);
      for (const parts of [snapshot, before.parts]) {
        expect(Object.getPrototypeOf(parts)).to.equal(Object.prototype);
        expect(Object.getOwnPropertyDescriptor(parts, key)).to.eql({
          value: `${ah}:size=2`,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }

      const parsed = Json.parse<t.CompositeHash>(Json.stringify(before));
      if (!Is.record(parsed)) throw new Error('Expected composite JSON fixture.');
      expect(parsed).to.eql(before);
      expect(Object.getOwnPropertyDescriptor(parsed.parts, key)?.value).to.eql(`${ah}:size=2`);

      snapshot[key] = 'detached';
      delete snapshot['z.txt'];
      expect(hash.parts).to.eql(before.parts);
      expect(hash.digest).to.eql(expectedDigest);
      expect(hash.add(key, c)).to.equal(hash);
      expect(hash.length).to.eql(2);
      expect(hash.parts[key]).to.eql(`${ch}:size=3`);
      expect(hash.digest).to.eql(Hash.sha256(`${ch}\n${bh}`));
      expect(before.parts[key]).to.eql(`${ah}:size=2`);
      expect(before.digest).to.eql(expectedDigest);

      expect(hash.remove(key)).to.equal(hash);
      expect(hash.length).to.eql(1);
      expect(Object.getOwnPropertyDescriptor(hash.parts, key)).to.eql(undefined);
      expect(hash.digest).to.eql(Hash.sha256(bh));
      hash.remove('missing').remove('z.txt');
      expect(hash.length).to.eql(0);
      expect(hash.digest).to.eql('');
      hash.add(key, a);
      expect(hash.length).to.eql(1);
      expect(hash.digest).to.eql(Hash.sha256(ah));
      expect(Object.getOwnPropertyDescriptor(hash.parts, key)?.value).to.eql(`${ah}:size=2`);
    });
  }

  it('inherited setters → bypassed during collection and snapshot construction', () => {
    const key = '_compositeOwnKey';
    const inherited = Object.getOwnPropertyDescriptor(Object.prototype, key);
    let setterCalls = 0;
    try {
      // Default Deno protects __proto__; this fixture distinguishes ordinary setter dispatch.
      Object.defineProperty(Object.prototype, key, {
        configurable: true,
        set() {
          setterCalls += 1;
          throw new Error('Composite collection invoked an inherited setter.');
        },
      });
      const hash = CompositeHash.builder([{ key, value: 'before' }]);
      hash.add(key, 'after');
      expect(hash.length).to.eql(1);
      for (const parts of [hash.parts, hash.toObject().parts]) {
        expect(Object.getOwnPropertyDescriptor(parts, key)?.value).to.eql(Hash.sha256('after'));
      }
      expect(hash.digest).to.eql(Hash.sha256(Hash.sha256('after')));
      expect(setterCalls).to.eql(0);
    } finally {
      if (inherited) Object.defineProperty(Object.prototype, key, inherited);
      else Reflect.deleteProperty(Object.prototype, key);
    }
  });
});
