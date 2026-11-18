import { ed25519, ED25519_TORSION_SUBGROUP } from '@noble/curves/ed25519.js';
import { Curves } from '../mod.ts';
import { isValidPublicKeyWith } from '../u.ed25519.ts';
import { decodeHex, describe, expect, expectTypeOf, it, SignEd25519, type t } from './common.ts';

// RFC 8032 section 7.1, TEST 1: a fixed control independent of local key generation.
const publicKey = decodeHex('d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a');
const invalidY = 'bad point: invalid y coordinate';
const negativeZero = 'bad point: x=0 and x_0=1';
const rangePrefix = `expected valid point.y: 0 <= n < ${ed25519.Point.Fp.ORDER}, got `;

const malformed = [
  ['off-curve y=2', new Uint8Array([2, ...new Uint8Array(31)])],
  ['y=p', decodeHex('edffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f')],
  ['y=p+1', decodeHex('eeffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f')],
  ['negative-zero identity', new Uint8Array([1, ...new Uint8Array(30), 128])],
] as const;

describe('Curves.Ed25519 public-key admission', () => {
  it('public leaf → canonical runtime and type surface', async () => {
    const { Curves: leaf } = await import('@sys/crypto/curves');
    expect(leaf).to.equal(Curves);
    expectTypeOf(leaf).toEqualTypeOf<t.Curves.Lib>();
    expectTypeOf(leaf.Ed25519.isValidPublicKey(publicKey)).toEqualTypeOf<boolean>();
    expect(leaf.Ed25519.isValidPublicKey(publicKey)).to.equal(true);
  });

  it('native-generated keys → accepted without altering signing or input', async () => {
    const keys = await SignEd25519.generateKeyPair();
    const raw = new Uint8Array(await crypto.subtle.exportKey('raw', keys.publicKey));
    const snapshot = raw.slice();
    expect(Curves.Ed25519.isValidPublicKey(raw)).to.equal(true);
    expect(raw).to.eql(snapshot);
    const bytes = new Uint8Array([1, 2, 3]);
    const signature = await SignEd25519.sign({ bytes, privateKey: keys.privateKey });
    const verified = await SignEd25519.verify({ bytes, signature, publicKey: keys.publicKey });
    expect(verified).to.equal(true);
  });

  it('offset views → selected bytes only, with backing-buffer preservation', () => {
    const backing = new Uint8Array(40).fill(255);
    const view = backing.subarray(4, 36);
    view.set(publicKey);
    const snapshot = backing.slice();
    expect(Curves.Ed25519.isValidPublicKey(view)).to.equal(true);
    expect(backing).to.eql(snapshot);

    view.fill(0);
    view[0] = 2; // Off-curve selected bytes, regardless of surrounding buffer contents.
    const invalidSnapshot = backing.slice();
    expect(Curves.Ed25519.isValidPublicKey(view)).to.equal(false);
    expect(backing).to.eql(invalidSnapshot);
  });

  it('all out-of-field y encodings with either sign bit → refusal without mutation', () => {
    // p through 2^255 - 1 differ only in their low octet: 237 through 255.
    for (const low of Array.from({ length: 19 }, (_, offset) => 237 + offset)) {
      for (const sign of [0, 128]) {
        const bytes = new Uint8Array(32).fill(255);
        bytes[0] = low;
        bytes[31] = 127 | sign;
        const snapshot = bytes.slice();
        expect(Curves.Ed25519.isValidPublicKey(bytes)).to.equal(false);
        expect(bytes).to.eql(snapshot);
      }
    }
  });

  it('non-key inputs and wrong lengths → refusal before decoding', () => {
    const invalid = [
      undefined,
      null,
      {},
      [],
      'key',
      new Uint16Array(32),
      new Uint8Array(),
      new Uint8Array(31),
      new Uint8Array(33),
    ];
    for (const input of invalid) {
      const bytes = input as Uint8Array; // Deliberately exercise untyped callers.
      expect(Curves.Ed25519.isValidPublicKey(bytes)).to.equal(false);
      expect(isValidPublicKeyWith(bytes, () => {
        throw new Error('Decoder must not run');
      })).to.equal(false);
    }
  });

  for (const [label, bytes] of malformed) {
    it(`${label} → refusal without input mutation`, () => {
      const snapshot = bytes.slice();
      expect(Curves.Ed25519.isValidPublicKey(bytes)).to.equal(false);
      expect(bytes).to.eql(snapshot);
    });
  }

  it('all eight torsion points → refusal, including the torsion-free identity', () => {
    for (const hex of ED25519_TORSION_SUBGROUP) {
      expect(Curves.Ed25519.isValidPublicKey(decodeHex(hex))).to.equal(false);
    }
    expect(ed25519.Point.ZERO.isTorsionFree()).to.equal(true);
  });

  it('prime-order base plus nonzero torsion → refusal despite not being small-order', () => {
    // Library group operations construct the fixtures; no local curve arithmetic.
    for (const hex of ED25519_TORSION_SUBGROUP.slice(1)) {
      const mixed = ed25519.Point.BASE.add(ed25519.Point.fromHex(hex));
      expect(mixed.isSmallOrder()).to.equal(false);
      expect(Curves.Ed25519.isValidPublicKey(mixed.toBytes())).to.equal(false);
    }
    expect(Curves.Ed25519.isValidPublicKey(ed25519.Point.BASE.toBytes())).to.equal(true);
  });

  it('Noble decode alone → insufficient admission predicate', () => {
    const identity = decodeHex(ED25519_TORSION_SUBGROUP[0]);
    expect(ed25519.utils.isValidPublicKey(identity, false)).to.equal(true);
    expect(Curves.Ed25519.isValidPublicKey(identity)).to.equal(false);
    expect(ed25519.utils.isValidPublicKey(malformed[2][1])).to.equal(true);
    expect(Curves.Ed25519.isValidPublicKey(malformed[2][1])).to.equal(false);
  });

  it('pinned decoder rejection signals → false', () => {
    const errors = [
      new Error(invalidY),
      new Error(negativeZero),
      new RangeError(`${rangePrefix}${ed25519.Point.Fp.ORDER}`),
    ];
    for (const error of errors) {
      expect(isValidPublicKeyWith(publicKey, () => {
        throw error;
      })).to.equal(false);
    }
  });

  it('distinguishable decoder faults → original failure, not an invalid-key result', () => {
    const errors = [
      new Error('UNEXPECTED_DECODER_FAILURE'),
      new TypeError(invalidY),
      new RangeError(invalidY),
      new Error(`${rangePrefix}${ed25519.Point.Fp.ORDER}`),
      new RangeError(`${rangePrefix}UNEXPECTED_FAILURE`),
      new RangeError(rangePrefix),
      new RangeError(`${rangePrefix}${ed25519.Point.Fp.ORDER}\n`),
      new RangeError(`${rangePrefix}${ed25519.Point.Fp.ORDER}\r`),
      new RangeError(`${rangePrefix}${ed25519.Point.Fp.ORDER}\u2028`),
      new RangeError(`${rangePrefix}${ed25519.Point.Fp.ORDER} `),
      new RangeError('expected valid coordinate y: unexpected failure'),
      new Error(`${invalidY}: unexpected suffix`),
    ];
    for (const error of errors) {
      const decode = () => {
        throw error;
      };
      expect(() => isValidPublicKeyWith(publicKey, decode)).to.throw(error);
    }
  });

  const impossibleCoordinates = [
    '00',
    '0',
    '01',
    `0${ed25519.Point.Fp.ORDER}`,
    `${ed25519.Point.Fp.ORDER - 1n}`,
    `${1n << 255n}`,
  ];
  for (const coordinate of impossibleCoordinates) {
    it(`impossible range-error coordinate ${coordinate} → original failure`, () => {
      const error = new RangeError(`${rangePrefix}${coordinate}`);
      const decode = () => {
        throw error;
      };
      expect(() => isValidPublicKeyWith(publicKey, decode)).to.throw(error);
    });
  }

  it('non-Error decoder failures → original thrown value', () => {
    for (const failure of [undefined, null, invalidY, { message: invalidY }]) {
      try {
        isValidPublicKeyWith(publicKey, () => {
          throw failure;
        });
        expect.fail('Expected decoder failure');
      } catch (actual) {
        expect(actual).to.equal(failure);
      }
    }
  });

  for (const operation of ['is0', 'isTorsionFree'] as const) {
    it(`${operation} fault with decoder rejection text → propagates outside decode catch`, () => {
      const error = new Error(invalidY);
      const point = { is0: () => false, isTorsionFree: () => true };
      point[operation] = () => {
        throw error;
      };
      expect(() => isValidPublicKeyWith(publicKey, () => point)).to.throw(error);
    });
  }
});
