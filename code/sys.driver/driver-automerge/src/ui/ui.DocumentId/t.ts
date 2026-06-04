import type { t } from './common.ts';
import type * as THook from './t.hooks.ts';
import type * as TParse from './t.parse.ts';

type ActionParams = ActionParamsCopyUrl | ActionParamsPlain;
type ActionParamsPlain = { action: 'Load' | 'Create' | 'Clear' | 'Copy' };
type ActionParamsCopyUrl = { action: 'Copy:Url'; href: string; addressbarAction: 'add' | 'remove' };

/**
 * Document-id UI contracts.
 */
export declare namespace DocumentId {
  /** Library of document-id UI tools. */
  export type Lib = {
    readonly View: t.FC<Props>;
    readonly useController: Hook.Use;
    readonly Parse: Parse.Lib;
  };

  /** Component props. */
  export type Props = {
    debug?: boolean;
    controller?: Hook.Instance | Hook.Args;
    placeholder?: string;
    label?: string;
    labelOpacity?: t.Percent;
    enabled?: boolean;
    autoFocus?: boolean | number;
    theme?: t.CommonTheme;
    style?: t.CssInput;
    buttonStyle?: t.CssInput;
    background?: string | number;
    onReady?: Event.ReadyHandler;
    onChange?: Event.ChangedHandler;
  };

  /**
   * Document-id action contracts.
   */
  export namespace Action {
    /** The various states the action button can assume. */
    export type Name = ActionParams['action'];

    /** `<DocumentId>` action triggered event. */
    export type Args = ActionParams;

    /** Handler for when the `<DocumentId>` action button is triggered. */
    export type Handler = (e: Args) => void;
  }

  /**
   * Document-id event contracts.
   */
  export namespace Event {
    /** Handler for when the `<DocumentId>` is ready. */
    export type ReadyHandler = (e: Changed) => void;

    /** Handler for when the `<DocumentId>` changes value. */
    export type ChangedHandler = (e: Changed) => void;

    /** The `<DocumentId>` changed event. */
    export type Changed = {
      readonly is: { readonly head: boolean };
      readonly signals: Hook.Signals;
      readonly values: Hook.SignalValues;
      readonly repo: t.CrdtRepo;
    };
  }

  /**
   * Document-id URL contracts.
   */
  export namespace Url {
    /** Handler that generates a URL when activated by a user gesture. */
    export type Factory = (e: FactoryArgs) => t.StringUrl | undefined;

    /** Arguments passed to a document-id URL factory. */
    export type FactoryArgs = {
      readonly docId: t.StringId;
      readonly urlKey: string;
    };
  }

  /**
   * Document-id controller hook contracts.
   */
  export namespace Hook {
    export type Use = THook.Use;
    export type Args<T = Record<string, unknown>> = THook.Args<T>;
    export type Instance = THook.Instance;
    export type Props = THook.Props;
    export type Signals = THook.Signals;
    export type SignalValues = THook.SignalValues;
  }

  /**
   * Document-id parser contracts.
   */
  export namespace Parse {
    export type Lib = TParse.Lib;
    export type Result = TParse.Result;
  }
}
