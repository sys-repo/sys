import { type t, describe, expectTypeOf } from '../../-test.ts';

/**
 * Type-level smoke test for Immutable primitives.
 * Ensures structural relationships and readonly guarantees.
 */
describe('Types: Immutable', () => {
  type Foo = { msg: string };
  type Patch = { op: string };
  const v = {} as any;

  describe('Immutable<T>', () => {
    /**
     * Immutable<T> must have `current` and a writable `change(...)`.
     */
    expectTypeOf<t.Immutable<Foo, Patch>>(v).toMatchTypeOf<{
      readonly current: Foo;
      change(fn: (draft: Foo) => void, options?: unknown): void;
    }>();

    /**
     * ImmutableReadonly<T> must expose only readonly current.
     */
    expectTypeOf<t.ImmutableReadonly<Foo>>(v).toEqualTypeOf<{ readonly current: Foo }>();
  });

  describe('ImmutableRef<T>', () => {
    /**
     * ImmutableRef<T,P> must extend Immutable<T,P>.
     */
    expectTypeOf<t.ImmutableRef<Foo, Patch>>(v).toMatchTypeOf<t.Immutable<Foo, Patch>>();

    /**
     * ImmutableRefReadonly<T,P> must extend ImmutableReadonly<T>.
     */
    expectTypeOf<t.ImmutableRefReadonly<Foo, Patch>>(v).toMatchTypeOf<t.ImmutableReadonly<Foo>>();
  });

  describe('Immutable Events', () => {
    type Ev = t.ImmutableEvents<Foo, Patch>;
    type C = t.InferImmutableEvent<Ev>;

    /**
     * Verify the event payload inference
     */
    expectTypeOf<C>(v).toEqualTypeOf<t.ImmutableChangeReadonly<Foo, Patch>>();

    /**
     * Verify the path() factory returns an ImmutablePathEvents whose $ emits the same
     */
    type PathEvents = ReturnType<Ev['path']>;
    expectTypeOf<PathEvents['$']>(v).toEqualTypeOf<
      t.Observable<t.ImmutableChangeReadonly<Foo, Patch>>
    >();
  });
});
