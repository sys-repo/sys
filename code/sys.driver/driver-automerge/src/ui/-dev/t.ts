import type { t } from './common.ts';
export type * from './ui.ObjectView/t.ts';

/**
 * Development helper contracts.
 */
export declare namespace Dev {
  /** Library of development helpers. */
  export type Lib = {
    readonly ObjectView: t.FC<t.CrdtObjectViewProps>;

    /** Construct a normalized, display-safe string label for a given object path. */
    fieldFromPath(path?: t.ObjectPath, opts?: { prefix?: string }): string;

    /** Construct an array of `<ObjectView>`-safe expand paths. */
    expandPaths(path: (t.ObjectPath | undefined)[], opts?: { prefix?: string }): string[];
  };
}
