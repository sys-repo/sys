/** Type re-exports. */
export type * from './t.io.descriptor.ts';
export type * from './t.io.file-content.ts';
export type * from './t.io.timeline.assets.ts';
export type * from './t.io.timeline.playback.ts';
export type * from './t.io.ts';
export type * from './t.lib.ts';
export type * from './t.spec.ts';

/** Result wrapper for client operations. */
export type SlugClientResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: SlugClientError };

/** Error shape returned by slug client operations. */
export type SlugClientError =
  | { readonly kind: 'schema'; readonly message: string }
  | {
      readonly kind: 'http';
      readonly status: number;
      readonly statusText: string;
      readonly url: string;
      readonly message: string;
    };
