type O = Record<string, unknown>;

export type UseProxyDiff<T extends O> = (prev: T, next: T) => boolean;
