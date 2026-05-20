/**
 * Shared backing error kind suffixes for Files command adapters.
 */
export declare namespace FilesError {
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
