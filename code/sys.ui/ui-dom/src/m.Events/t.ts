export type * from './t.dom.ts';

/**
 * User interaction state contracts.
 */
export declare namespace UserHas {
  /** User interaction state surface. */
  export type Lib = {
    /** Whether the user has interacted with the current window. */
    readonly interacted: boolean;
  };
}
