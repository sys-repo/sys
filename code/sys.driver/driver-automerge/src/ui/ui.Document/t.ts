import type { t } from './common.ts';

/**
 * CRDT document UI contracts.
 */
export declare namespace Document {
  /** UI tools for working with CRDT document handles. */
  export type Lib = {
    readonly Id: t.Crdt.DocumentId.Lib;
    readonly Info: t.FC<Props>;
  };

  /** Statistics derived from a CRDT document. */
  export type Stats = {
    readonly bytes: number;
    readonly total: {
      readonly changes: number;
      readonly ops: number;
    };
  };

  /** Component props. */
  export type Props = {
    repo?: t.Crdt.Repo;
    doc?: t.Crdt.Ref;
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };
}
