import type { t } from './common.ts';
import type * as TLink from './t.Link.ts';

type IRange = t.Monaco.I.IRange;
type IPosition = t.Monaco.I.IPosition;

/**
 * Monaco editor driver surface.
 */
export declare namespace MonacoDriver {
  /** Runtime library surface. */
  export type Lib = {
    readonly Is: t.EditorIs.Lib;
    readonly Bus: t.EditorBus.Lib;
    readonly Editor: React.FC<t.MonacoEditorProps>;
    readonly Crdt: t.EditorCrdt.Lib;
    readonly Prompt: t.EditorPrompt.Lib;
    readonly Yaml: t.EditorYaml.Lib;
    readonly Link: Link.Lib;
    readonly Error: t.EditorError.Lib;
  };

  /** Convenience bundle of the editor with the global Monaco API. */
  export type Ctx = {
    readonly editor: t.Monaco.Editor;
    readonly monaco: t.Monaco.Monaco;
  };

  /** The position of the editor cursor within a YAML document. */
  export type Cursor = {
    /** The editor the cursor position pertains to. */
    readonly editorId: t.StringId;
    /** The calculated path within the parsed document of where the cursor currently is. */
    readonly path: t.ObjectPath;
    /** The caret position within the text (line/column). */
    readonly position?: IPosition;
    /** Absolute character offset into the document. */
    readonly offset?: t.Index;
    /** The word under the caret (if resolved). */
    readonly word?: IRange;
  };

  /** Editor link helper contracts. */
  export namespace Link {
    export type Lib = TLink.Lib;
    export type Bounds = TLink.Bounds;
  }
}
