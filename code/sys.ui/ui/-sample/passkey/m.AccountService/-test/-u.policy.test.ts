import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import type { t } from '../common.ts';
import { capturePolicy } from '../u/u.policy.ts';

const options = (): t.AccountService.Options => ({
  rp: { id: 'example.test', name: 'Reference accounts' },
  origins: ['https://accounts.example.test'],
  algorithms: [-7],
  lifetimes: { challenge: 60_000, session: 300_000 },
  capacity: { accounts: 10, credentials: 20, transactions: 30, sessions: 40 },
});

describe('AccountService construction policy', () => {
  it('explicit policy → detached, deeply frozen authority', () => {
    const input = options();
    const result = capturePolicy(input);
    expectTypeOf<t.DeepReadonly<t.AccountService.Options>>(result);
    expect(result).to.eql(input);
    input.rp.id = 'other.test';
    input.origins[0] = 'https://other.test';
    input.algorithms[0] = -257;
    input.lifetimes.challenge = 1;
    input.capacity.accounts = 1;
    expect(result).to.eql(options());
    expect(Reflect.set(result.rp, 'id', 'other.test')).to.equal(false);
    expect(Reflect.set(result.origins, '0', 'https://other.test')).to.equal(false);
    expect(Reflect.set(result.algorithms, '0', -257)).to.equal(false);
    expect(Reflect.set(result.lifetimes, 'challenge', 1)).to.equal(false);
    expect(Reflect.set(result.capacity, 'accounts', 1)).to.equal(false);
    expect(result).to.eql(options());
  });

  it('missing policy → refusal, never implicit defaults', () => {
    // @ts-expect-error Required policy cannot be omitted by a typed caller.
    expect(() => capturePolicy()).to.throw(TypeError, 'Invalid account service policy.');
    // @ts-expect-error All policy dimensions are mandatory.
    expect(() => capturePolicy({})).to.throw(TypeError, 'Invalid account service policy.');
  });

  it('non-positive, non-finite, or unsafe bounds → refusal', () => {
    for (const value of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      for (const field of ['challenge', 'session'] as const) {
        const input = options();
        input.lifetimes[field] = value;
        expect(() => capturePolicy(input)).to.throw(TypeError, 'Invalid account service policy.');
      }
      for (const field of ['accounts', 'credentials', 'transactions', 'sessions'] as const) {
        const input = options();
        input.capacity[field] = value;
        expect(() => capturePolicy(input)).to.throw(TypeError, 'Invalid account service policy.');
      }
    }
  });

  it('empty or duplicate selection → refusal', () => {
    const repeated = ['https://accounts.example.test', 'https://accounts.example.test'];
    for (const origins of [[], repeated]) {
      expect(() => capturePolicy({ ...options(), origins })).to.throw(TypeError);
    }
    for (const algorithms of [[], [-7, -7], [NaN], [Infinity], [1.5]]) {
      expect(() => capturePolicy({ ...options(), algorithms })).to.throw(TypeError);
    }
  });

  it('origin and RP must be exact, secure, and related', () => {
    const origins = [
      'https://accounts.example.test/',
      'http://accounts.example.test',
      'https://unrelated.test',
      'https://notexample.test',
      'https://user:secret@accounts.example.test',
      'https://accounts.example.test/path',
      'https://accounts.example.test?secret=value',
      'https://accounts.example.test#secret',
      'null',
    ];
    for (const origin of origins) {
      expect(() => capturePolicy({ ...options(), origins: [origin] }))
        .to.throw(TypeError, 'Invalid account service policy.');
    }
    const ids = ['', 'EXAMPLE.test', 'example.test.', 'example.test:443', 'user@example.test'];
    for (const id of ids) {
      expect(() => capturePolicy({ ...options(), rp: { id, name: 'Reference accounts' } }))
        .to.throw(TypeError, 'Invalid account service policy.');
    }
  });

  it('explicit localhost HTTP origin → development policy', () => {
    const input = options();
    input.rp.id = 'localhost';
    input.origins = ['http://localhost:8787'];
    expect(capturePolicy(input)).to.eql(input);
  });

  it('unknown policy members → refusal rather than silently ignored authority', () => {
    const input = { ...options(), endpoint: 'https://other.test' };
    expect(() => capturePolicy(input)).to.throw(TypeError, 'Invalid account service policy.');
    const nested = { ...options(), capacity: { ...options().capacity, other: 1 } };
    expect(() => capturePolicy(nested)).to.throw(TypeError, 'Invalid account service policy.');
  });
});
