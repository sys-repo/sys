import { describe, Dispose, expect, expectTypeOf, Is, it, type t } from './common.ts';

describe('Dispose.omitDispose', () => {
  type T = t.Lifecycle & { count: number };

  it('lifecycle projection → observed state without direct or protocol authority', () => {
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
    expect(Symbol.asyncDispose in projection).to.eql(true);
    expect(Object.hasOwn(projection, Symbol.asyncDispose)).to.eql(true);
    expect(Reflect.get(projection, Symbol.asyncDispose)).to.eql(undefined);
    expect(Is.lifecycleView(projection)).to.eql(false);
    expect(Is.until(projection)).to.eql(false);
    expect(Is.untilInput(projection)).to.eql(false);
    expect(projection.dispose$).to.equal(source.dispose$);
    expect(projection.disposed).to.eql(false);

    await source.dispose();
    expect(projection.disposed).to.eql(true);
  });

  it('branded lifecycle projection → retained behavior stays callable', () => {
    const life = Dispose.lifecycle();

    class BrandedLifecycle extends Map<string, number> implements t.Lifecycle {
      #value = 123;
      readonly dispose$ = life.dispose$;

      get disposed() {
        return life.disposed;
      }

      get value() {
        return this.#value;
      }

      increment() {
        return ++this.#value;
      }

      read() {
        return this.#value;
      }

      readonly ownRead = this.read;

      dispose(reason?: unknown) {
        life.dispose(reason);
      }

      [Symbol.dispose]() {
        life[Symbol.dispose]();
      }
    }

    const source = new BrandedLifecycle();
    source.set('count', 7);
    Object.defineProperty(source, 'ownRead', { configurable: false, writable: false });
    const projection = Dispose.omitDispose(source);
    const ownRead = Object.getOwnPropertyDescriptor(projection, 'ownRead');

    expect(projection).to.not.equal(source);
    expect(projection).to.be.instanceOf(BrandedLifecycle);
    expect(projection.constructor).to.equal(BrandedLifecycle);
    expect(projection.value).to.eql(123);
    expect(projection.read).to.equal(projection.read);
    expect(projection.read()).to.eql(123);
    expect(projection.ownRead()).to.eql(123);
    expect(ownRead?.configurable).to.eql(false);
    expect(ownRead?.writable).to.eql(false);
    expect(ownRead?.value).to.equal(projection.ownRead);
    expect(projection.increment()).to.eql(124);
    expect(source.value).to.eql(124);
    expect(projection.get('count')).to.eql(7);
    expect(projection.set('next', 8)).to.equal(projection);
    expect(projection.valueOf()).to.equal(projection);
    expect(projection.size).to.eql(2);
    expect(Reflect.get(projection, 'dispose')).to.eql(undefined);
    expect(Reflect.get(projection, Symbol.dispose)).to.eql(undefined);

    source.dispose();
    expect(projection.disposed).to.eql(true);
  });

  it('retained callables → preserve call and construction categories', () => {
    const life = Dispose.lifecycle();

    class Item {
      readonly constructedBy: Function | undefined;

      constructor(readonly value: number) {
        this.constructedBy = new.target;
      }
    }

    type Source = t.Lifecycle & {
      readonly Ctor: typeof Item;
      readonly callback: () => string;
    };

    const callback = () => 'callback';
    const source = Dispose.toLifecycle<Source>(life, { Ctor: Item, callback });
    const projection = Dispose.omitDispose(source);

    expect(projection.Ctor).to.equal(projection.Ctor);
    expect(projection.Ctor.name).to.eql(Item.name);
    expect(projection.Ctor.length).to.eql(Item.length);
    expect(projection.Ctor.prototype).to.equal(Item.prototype);

    const direct = new projection.Ctor(7);
    expect(direct).to.be.instanceOf(Item);
    expect(direct.value).to.eql(7);
    expect(direct.constructedBy).to.equal(Item);

    class Child extends projection.Ctor {}
    const child = new Child(8);
    expect(child).to.be.instanceOf(Item);
    expect(child).to.be.instanceOf(Child);
    expect(child.constructedBy).to.equal(Child);

    expect(projection.callback()).to.eql('callback');
    expect(() => Reflect.construct(projection.callback, [])).to.throw(TypeError);
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
    expect(Symbol.asyncDispose in projection).to.eql(true);
    expect(Reflect.get(projection, Symbol.asyncDispose)).to.eql(undefined);
    expect(Is.lifecycleView(projection)).to.eql(false);
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
