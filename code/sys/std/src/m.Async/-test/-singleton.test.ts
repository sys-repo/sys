import { type t, describe, expect, it } from '../../-test.ts';
import { Rx } from '../common.ts';
import { singleton } from '../mod.ts';

describe('Async: singleton', () => {
  type P = t.DisposableLike & { tag?: string };

  const makeProducer = (counter: { created: number; disposed: number }, tag?: string): P => {
    counter.created += 1;
    return {
      tag,
      dispose: () => {
        counter.disposed += 1;
      },
    };
  };

  it('creates new on first acquire, reuses on subsequent acquires', () => {
    const registry = new Map<string, { refCount: number; producer: P }>();
    const counter = { created: 0, disposed: 0 };

    const a1 = singleton(registry, 'k', () => makeProducer(counter));
    const a2 = singleton(registry, 'k', () => makeProducer(counter));

    expect(counter.created).to.eql(1);
    expect(a1.producer).to.equal(a2.producer);
    expect(registry.get('k')?.refCount).to.eql(2);

    a1.dispose();
    expect(registry.has('k')).to.eql(true);
    expect(counter.disposed).to.eql(0);

    a2.dispose();
    expect(registry.has('k')).to.eql(false);
    expect(counter.disposed).to.eql(1);
  });

  it('separate keys create separate producers', () => {
    const registry = new Map<string, { refCount: number; producer: P }>();
    const counter = { created: 0, disposed: 0 };

    const a = singleton(registry, 'a', () => makeProducer(counter, 'a'));
    const b = singleton(registry, 'b', () => makeProducer(counter, 'b'));

    expect(counter.created).to.eql(2);
    expect(a.producer).to.not.equal(b.producer);
    expect(registry.get('a')?.refCount).to.eql(1);
    expect(registry.get('b')?.refCount).to.eql(1);

    a.dispose();
    expect(registry.has('a')).to.eql(false);
    expect(registry.has('b')).to.eql(true);

    b.dispose();
    expect(registry.has('b')).to.eql(false);
    expect(counter.disposed).to.eql(2);
  });

  it('idempotent consumer dispose: producer disposed only once', () => {
    const registry = new Map<string, { refCount: number; producer: P }>();
    const counter = { created: 0, disposed: 0 };

    const c1 = singleton(registry, 'k', () => makeProducer(counter));
    expect(registry.get('k')?.refCount).to.eql(1);

    c1.dispose();
    c1.dispose(); // no-op

    expect(registry.has('k')).to.eql(false);
    expect(counter.disposed).to.eql(1);
  });

  it('lifecycle "until$" releases the ref (producer disposed when last consumer ends)', () => {
    const registry = new Map<string, { refCount: number; producer: P }>();
    const counter = { created: 0, disposed: 0 };

    const { dispose: end, dispose$ } = Rx.lifecycle();
    const a = singleton(registry, 'k', () => makeProducer(counter), dispose$);
    const b = singleton(registry, 'k', () => makeProducer(counter));

    expect(counter.created).to.eql(1);
    expect(registry.get('k')?.refCount).to.eql(2);

    end(); // auto-release "a"
    expect(registry.get('k')?.refCount).to.eql(1);
    expect(counter.disposed).to.eql(0);

    b.dispose(); // last release
    expect(registry.has('k')).to.eql(false);
    expect(counter.disposed).to.eql(1);
  });

  it('re-acquiring after full teardown constructs a fresh producer', () => {
    const registry = new Map<string, { refCount: number; producer: P }>();
    const counter = { created: 0, disposed: 0 };

    const a1 = singleton(registry, 'k', () => makeProducer(counter));
    const first = a1.producer;
    a1.dispose();
    expect(registry.has('k')).to.eql(false);
    expect(counter.disposed).to.eql(1);

    const a2 = singleton(registry, 'k', () => makeProducer(counter));
    const second = a2.producer;

    expect(counter.created).to.eql(2);
    expect(first).to.not.equal(second);
    a2.dispose();
  });

  it('idempotent dispose for reused entry', () => {
    const registry = new Map<string, { refCount: number; producer: P }>();
    const counter = { created: 0, disposed: 0 };

    const a1 = singleton(registry, 'k', () => makeProducer(counter));
    const a2 = singleton(registry, 'k', () => makeProducer(counter));
    expect(registry.get('k')?.refCount).to.eql(2);

    a2.dispose();
    a2.dispose(); // second call is a no-op
    expect(registry.get('k')?.refCount).to.eql(1);
    expect(counter.disposed).to.eql(0);

    a1.dispose();
    expect(registry.has('k')).to.eql(false);
    expect(counter.disposed).to.eql(1);
  });

  it('non-string keys (object identity)', () => {
    const registry = new Map<object, { refCount: number; producer: P }>();
    const counter = { created: 0, disposed: 0 };
    const keyA = { foo: 1 };
    const keyB = { foo: 1 };

    const a1 = singleton(registry, keyA, () => makeProducer(counter));
    const a2 = singleton(registry, keyA, () => makeProducer(counter));
    const b1 = singleton(registry, keyB, () => makeProducer(counter));

    expect(counter.created).to.eql(2); // one for keyA, one for keyB
    expect(registry.get(keyA)?.refCount).to.eql(2);
    expect(registry.get(keyB)?.refCount).to.eql(1);

    a1.dispose();
    b1.dispose();
    expect(registry.has(keyA)).to.eql(true);
    expect(registry.has(keyB)).to.eql(false);

    a2.dispose();
    expect(registry.has(keyA)).to.eql(false);
    expect(counter.disposed).to.eql(2);
  });

  it('swallows errors from producer.dispose and still clears registry', () => {
    const registry = new Map<string, { refCount: number; producer: P }>();
    let calls = 0;
    const makeThrower = (): P => ({
      dispose: () => {
        calls += 1;
        throw new Error('boom');
      },
    });

    const h1 = singleton(registry, 'x', makeThrower);
    const h2 = singleton(registry, 'x', makeThrower);
    expect(registry.get('x')?.refCount).to.eql(2);

    // First dispose does not tear down
    h1.dispose();
    expect(registry.get('x')?.refCount).to.eql(1);

    // Last dispose triggers producer.dispose() once and swallows error
    expect(() => h2.dispose()).to.not.throw();
    expect(registry.has('x')).to.eql(false);
    expect(calls).to.eql(1);
  });

  it('until$ + manual dispose are jointly idempotent for the same handle', () => {
    const registry = new Map<string, { refCount: number; producer: P }>();
    const counter = { created: 0, disposed: 0 };

    const { dispose: end, dispose$ } = Rx.lifecycle();
    const a = singleton(registry, 'k', () => makeProducer(counter), dispose$);
    const b = singleton(registry, 'k', () => makeProducer(counter));
    expect(registry.get('k')?.refCount).to.eql(2);

    end(); // auto-release a
    a.dispose(); // second release on same handle (no-op)
    expect(registry.get('k')?.refCount).to.eql(1);
    expect(counter.disposed).to.eql(0);

    b.dispose(); // last release
    expect(registry.has('k')).to.eql(false);
    expect(counter.disposed).to.eql(1);
  });
});
