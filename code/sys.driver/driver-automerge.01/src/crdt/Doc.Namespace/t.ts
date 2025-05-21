import type { t } from '../common.ts';

type O = Record<string, unknown>;

export type NamespaceMap<N extends string = string> = Record<N, O>;
export type Namespace<L extends O, N extends string = string> = {
  namespace: N;
  lens: t.Lens<L>;
};

/**
 * Manager for working with [Lens] objects attached to a {map}
 * where the "keys" are the namespace "names".
 */
export type NamespaceManager<N extends string = string> = t.Lifecycle & {
  readonly container: Readonly<NamespaceMap<N>>;
  list<L extends O>(): Namespace<L, N>[];
  lens<L extends O>(namespace: N, initial: L): t.Lens<L>;
  events(dispose$?: t.UntilObservable): t.LensEvents<t.NamespaceMap<N>>;
  typed<T extends string>(): NamespaceManager<T>;
};
