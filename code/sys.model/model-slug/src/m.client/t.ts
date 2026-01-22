export type * from './t.lib.io.ts';
export type * from './t.lib.ts';
export type * from './t.spec.ts';

export type SlugClientResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: SlugClientError };

export type SlugClientError =
  | { readonly kind: 'schema'; readonly message: string }
  | {
      readonly kind: 'http';
      readonly status: number;
      readonly statusText: string;
      readonly url: string;
      readonly message: string;
    };
