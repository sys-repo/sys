import { describe, Dispose, expect, expectTypeOf, Is, it, type t } from './common.ts';

describe('Dispose.omitDispose', () => {
  type T = t.Lifecycle & { count: number };

  it('lifecycle projection → observed state without direct or native authority', () => {
    const lifecycle = Dispose.lifecycle();
    const source = Dispose.toLifecycle<T>(lifecycle, { count: 123 });
    expect('dispose' in source).to.eql(true);
    expect(Symbol.dispose in source).to.eql(true);

    const projection = Dispose.omitDispose(source);
    type AuthorityKey = 'dispose' | typeof Symbol.dispose | typeof Symbol.asyncDispose;
    type ProjectionAuthority = Extract<keyof typeof projection, AuthorityKey>;
    const authorityOmitted: ProjectionAuthority extends never ? true : false = true;
    const view: t.LifecycleView = projection;

    expectTypeOf(projection).toEqualTypeOf<t.OmitDisposable<T>>();
    expect(authorityOmitted).to.eql(true);
    expect(view).to.equal(projection);
    expect(source).to.not.equal(projection);
    expect('dispose' in projection).to.eql(false);
    expect(Symbol.dispose in projection).to.eql(false);
    expect(Symbol.asyncDispose in projection).to.eql(false);
    expect(Is.disposable(projection)).to.eql(false);

    let count = 0;
    projection.dispose$.subscribe(() => count++);

    expect(projection.disposed).to.eql(false);
    lifecycle.dispose();

    expect(projection.disposed).to.eql(true);
    expect(count).to.eql(1);
  });

  it('async lifecycle projection → preserves observation without authority', async () => {
    const source = Dispose.lifecycleAsync();
    expect(Symbol.asyncDispose in source).to.eql(true);

    const projection = Dispose.omitDispose(source);

    expect('dispose' in projection).to.eql(false);
    expect(Symbol.dispose in projection).to.eql(false);
    expect(Symbol.asyncDispose in projection).to.eql(false);
    expect(projection.dispose$).to.equal(source.dispose$);
    expect(projection.disposed).to.eql(false);

    await source.dispose();
    expect(projection.disposed).to.eql(true);
  });

  it('authority-only values → outside the observable projection boundary', () => {
    type Input = Parameters<typeof Dispose.omitDispose>[0];
    type AuthorityRejected = t.Disposable extends Input ? false : true;
    const authorityRejected: AuthorityRejected = true;

    expectTypeOf(authorityRejected).toEqualTypeOf<true>();
  });

  it('own authority accessors → omitted without invoking getters', () => {
    const source = Dispose.lifecycle();
    let authorityGetterReads = 0;
    Object.defineProperties(source, {
      dispose: {
        configurable: true,
        get() {
          authorityGetterReads++;
          return () => undefined;
        },
      },
      [Symbol.dispose]: {
        configurable: true,
        get() {
          authorityGetterReads++;
          return () => undefined;
        },
      },
      [Symbol.asyncDispose]: {
        configurable: true,
        get() {
          authorityGetterReads++;
          return () => Promise.resolve();
        },
      },
    });

    const projection = Dispose.omitDispose(source);

    expect(authorityGetterReads).to.eql(0);
    expect('dispose' in projection).to.eql(false);
    expect(Symbol.dispose in projection).to.eql(false);
    expect(Symbol.asyncDispose in projection).to.eql(false);
  });

  it('inherited authority → masked without invoking getters', () => {
    const owner = Dispose.lifecycle();
    const unrelated = Symbol('unrelated');
    let authorityGetterReads = 0;
    let unrelatedGetterReads = 0;
    const unrelatedGetter = () => {
      unrelatedGetterReads++;
      return 123;
    };
    const proto = Object.create(null, {
      dispose: { value: owner.dispose },
      [Symbol.dispose]: {
        get() {
          authorityGetterReads++;
          return owner[Symbol.dispose];
        },
      },
      [Symbol.asyncDispose]: { value: () => Promise.resolve() },
    });
    // Deliberately cross the canonical boundary with a descriptor-level hybrid fixture to prove
    // that inherited synchronous and asynchronous authority are both masked.
    const source: t.Lifecycle & { readonly [unrelated]: number } = Object.create(proto, {
      dispose$: { value: owner.dispose$ },
      disposed: { get: () => owner.disposed },
      [unrelated]: {
        configurable: true,
        enumerable: false,
        get: unrelatedGetter,
      },
    });

    const projection = Dispose.omitDispose(source);
    const unrelatedBefore = Object.getOwnPropertyDescriptor(source, unrelated);
    const unrelatedAfter = Object.getOwnPropertyDescriptor(projection, unrelated);

    expect(authorityGetterReads).to.eql(0);
    expect(unrelatedGetterReads).to.eql(0);
    expect(Object.getPrototypeOf(projection)).to.equal(proto);
    expect(Object.hasOwn(projection, 'dispose')).to.eql(true);
    expect(Object.hasOwn(projection, Symbol.dispose)).to.eql(true);
    expect(Object.hasOwn(projection, Symbol.asyncDispose)).to.eql(true);
    expect(Reflect.get(projection, 'dispose')).to.eql(undefined);
    expect(Reflect.get(projection, Symbol.dispose)).to.eql(undefined);
    expect(Reflect.get(projection, Symbol.asyncDispose)).to.eql(undefined);
    expect(authorityGetterReads).to.eql(0);
    expect(unrelatedGetterReads).to.eql(0);
    expect(unrelatedAfter).to.eql(unrelatedBefore);
    expect(unrelatedAfter?.get).to.equal(unrelatedGetter);
  });
});
