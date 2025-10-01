import { type t, describe, expect, it, Rx } from '../../-test.ts';
import { Bus } from '../mod.ts';

describe('Bus.singleton', () => {
  type P = t.Lifecycle & { disposed: boolean; dispose: () => void; hits?: number };
  const makeProducer = (counter: { created: number; disposed: number }): P => {
    counter.created += 1;
    const life = Rx.lifecycle();
    life.dispose$.subscribe(() => (counter.disposed += 1));
    return Rx.toLifecycle<P>(life, {});
  };

  it('creates a new producer on first acquire, reuses on subsequent acquires', () => {
    const registry = new Map<string, { refCount: number; producer: P }>();
    const counter = { created: 0, disposed: 0 };

    const a1 = Bus.singleton(registry, 'k', () => makeProducer(counter));
    const a2 = Bus.singleton(registry, 'k', () => makeProducer(counter));

    expect(counter.created).to.eql(1); // reused
    expect(a1.producer).to.equal(a2.producer);
    expect(registry.get('k')?.refCount).to.eql(2);

    // Disposing one consumer does not tear down the producer
    a1.dispose();
    expect(registry.has('k')).to.eql(true);
    expect(counter.disposed).to.eql(0);

    // Disposing last consumer tears down the producer
    a2.dispose();
    expect(registry.has('k')).to.eql(false);
    expect(counter.disposed).to.eql(1);
  });

  it('separate keys create separate producers', () => {
    const registry = new Map<string, { refCount: number; producer: P }>();
    const counter = { created: 0, disposed: 0 };

    const a = Bus.singleton(registry, 'a', () => makeProducer(counter));
    const b = Bus.singleton(registry, 'b', () => makeProducer(counter));

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

    const c1 = Bus.singleton(registry, 'k', () => makeProducer(counter));
    expect(registry.get('k')?.refCount).to.eql(1);

    // Dispose twice on the same consumer
    c1.dispose();
    c1.dispose();

    expect(counter.disposed).to.eql(1); // producer.dispose called once
    expect(registry.has('k')).to.eql(false); // entry removed
  });

  it('lifecycle "until" releases the ref (producer disposed when last consumer ends)', () => {
    const registry = new Map<string, { refCount: number; producer: P }>();
    const counter = { created: 0, disposed: 0 };

    const { dispose: end, dispose$ } = Rx.lifecycle();
    const a = Bus.singleton(registry, 'k', () => makeProducer(counter), dispose$);
    const b = Bus.singleton(registry, 'k', () => makeProducer(counter));
    expect(counter.created).to.eql(1);
    expect(registry.get('k')?.refCount).to.eql(2);

    // End the lifecycle-bound consumer
    end();
    expect(registry.get('k')?.refCount).to.eql(1);
    expect(counter.disposed).to.eql(0); // still one consumer alive

    // Disposing last consumer tears down
    b.dispose();
    expect(registry.has('k')).to.eql(false);
    expect(counter.disposed).to.eql(1);
  });

  it('re-acquiring after full teardown constructs a fresh producer', () => {
    const registry = new Map<string, { refCount: number; producer: P }>();
    const counter = { created: 0, disposed: 0 };

    const a1 = Bus.singleton(registry, 'k', () => makeProducer(counter));
    const first = a1.producer;
    a1.dispose();
    expect(registry.has('k')).to.eql(false);
    expect(counter.disposed).to.eql(1);

    const a2 = Bus.singleton(registry, 'k', () => makeProducer(counter));
    const second = a2.producer;

    expect(counter.created).to.eql(2);
    expect(first).to.not.equal(second);
    a2.dispose();
  });

  it('idempotent dispose for reused entry', () => {
    const registry = new Map<string, { refCount: number; producer: P }>();
    const counter = { created: 0, disposed: 0 };

    const a1 = Bus.singleton(registry, 'k', () => makeProducer(counter));
    const a2 = Bus.singleton(registry, 'k', () => makeProducer(counter));
    expect(registry.get('k')?.refCount).to.eql(2);

    a2.dispose();
    a2.dispose(); // second call is a no-op
    expect(registry.get('k')?.refCount).to.eql(1);
    expect(counter.disposed).to.eql(0);

    a1.dispose();
    expect(registry.has('k')).to.eql(false);
    expect(counter.disposed).to.eql(1);
  });
});
