/** Schema contract for Shell.Structure values. */
export declare namespace Schema {
  export type Lib<Structure> = {
    readonly structure: unknown;
    validate(input: unknown): Validation<Structure>;
  };

  export type Issue = {
    readonly kind: 'schema';
    readonly path: string;
    readonly message: string;
  };

  export type Validation<T> =
    | { readonly ok: true; readonly value: T; readonly errors: readonly [] }
    | { readonly ok: false; readonly errors: readonly Issue[] };
}
