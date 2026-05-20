/**
 * Shared backing error kind suffixes for Files command adapters.
 */
export declare namespace Error {
  /** Canonical suffixes used by Files backing-specific error names. */
  export type KindSuffix =
    | 'InvalidPath'
    | 'PathOutsideRoot'
    | 'NotFound'
    | 'NotFile'
    | 'NotDirectory'
    | 'PolicyDenied'
    | 'ReadTooLarge'
    | 'Unsupported';
}
