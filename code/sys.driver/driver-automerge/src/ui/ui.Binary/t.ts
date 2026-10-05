import type * as TSys from '@sys/types';
import type { t } from './common.ts';

/**
 * Binary CRDT UI contracts.
 */
export declare namespace Binary {
  /** User interface for working with binary data within CRDTs. */
  export type Lib = {
    /** React view for binary file maps stored in a CRDT document. */
    readonly View: t.FC<t.BinaryFile.Props>;

    /** Convert a browser `File` to a CRDT binary file. */
    fromBrowserFile(file: File): Promise<t.BinaryFile.File>;

    /** Convert a CRDT binary file back into a browser `File`. */
    toBrowserFile(file: t.BinaryFile.File): File;

    /** Convert clipboard paste data into CRDT binary files. */
    fromClipboard(clipboardData: DataTransfer): Promise<t.BinaryFile.File[]>;
  };
}

/**
 * Binary file component contracts.
 */
export declare namespace BinaryFile {
  /** Binary file data payload. */
  export type File = TSys.BinaryFile;

  /** Component props. */
  export type Props = {
    /** CRDT document containing the binary file map. */
    doc?: t.Crdt.Ref;
    /** Object path where the file map is stored. */
    path?: t.ObjectPath;
    /** Show debug rendering instead of the drop-target view. */
    debug?: boolean;
    /** System theme used for rendering. */
    theme?: t.CommonTheme;
    /** Style override applied to the root element. */
    style?: t.CssInput;
  };

  /** Map keyed by the hash value of the file bytes. */
  export type Map<T = File> = { [hash: string]: T };
}
