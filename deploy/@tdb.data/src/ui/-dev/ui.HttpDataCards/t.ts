import type { t } from './common.ts';

/** Type re-exports. */
export type * from '../common.t.ts';

/** Dev cards for probing staged data over HTTP. */
export declare namespace HttpDataCards {
  export namespace Spec {
    export type StateDefaults = {
      debug?: boolean;
      theme?: t.CommonTheme;
      env?: t.HttpOriginBase.Env;
      integrity?: boolean;
      dataset?: t.StringId;
    };

    export type Params = {
      debugWidth?: number;
      originSpec?: t.HttpOrigin.SpecMap;
      storageKey?: string;
      stateDefaults?: StateDefaults;
    };
  }

  export type DataCardKind = (typeof DataCardKindKinds)[number];
  export const DataCardKindKinds: readonly ['file-content', 'playback-content'];

  export type RefState = {
    readonly ref: t.Signal<string | undefined>;
    readonly refs: t.Signal<string[] | undefined>;
  };

  export type RefStateValue = {
    readonly ref: string | undefined;
    readonly refs: string[] | undefined;
  };

  export type SignalsProps = t.ActionProbe.SignalProps & {
    readonly selectionList: {
      readonly totalVisible: t.Signal<number | 'all' | undefined>;
    };
    readonly treeContent: RefState;
    readonly treePlayback: RefState;
  };

  export type SignalsDefaults = {
    readonly totalVisible?: number | 'all';
    readonly treeContent?: { readonly ref?: string; readonly refs?: string[] };
    readonly treePlayback?: { readonly ref?: string; readonly refs?: string[] };
    readonly action?: Parameters<t.ActionProbe.SignalsLib['create']>[0];
    readonly persist?: t.ImmutableRef<t.JsonMapU>;
    readonly persistKey?: string;
  };

  export type Signals = t.ActionProbe.Signals & {
    readonly props: SignalsProps;
  };

  export type SignalsState = t.ActionProbe.SignalsState & {
    readonly selectionList: {
      readonly totalVisible: number | 'all' | undefined;
    };
    readonly treeContent: RefStateValue;
    readonly treePlayback: RefStateValue;
  };

  export type TEnv = {
    readonly origin: t.StringUrl;
    readonly dataset: t.StringId;
    readonly docid?: t.StringId;
    readonly probe?: {
      readonly selectionList?: {
        readonly totalVisible?: number | 'all';
      };
      readonly treeContent?: {
        readonly ref?: string;
        readonly refs?: string[];
        readonly onRefChange?: (next: string) => void;
        readonly onRefsChange?: (next: string[]) => void;
      };
      readonly treePlayback?: {
        readonly ref?: string;
        readonly refs?: string[];
        readonly onRefChange?: (next: string) => void;
        readonly onRefsChange?: (next: string[]) => void;
      };
    };
  };

  export type PanelArgs = {
    readonly signals: Signals;
    readonly kind: DataCardKind;
    readonly origin: t.StringUrl;
    readonly dataset: t.StringId;
    readonly docid?: t.StringId;
    readonly theme?: t.CommonTheme;
    readonly debug?: boolean;
    readonly style?: t.CssInput;
    readonly onKindSelect?: (kind: DataCardKind) => void;
  };

  export type Lib = {
    readonly UI: t.FC<Props>;
    readonly createSignals: (input?: SignalsDefaults) => Signals;
    readonly createPanel: (args: PanelArgs) => t.ReactNode;
    readonly Spec: {
      readonly load: t.DevSpec.Loader.ModuleLoader<Spec.Params | void>;
    };
    readonly Card: {
      readonly TreeContent: t.ActionProbe.ProbeSpec<TEnv, { readonly kind: 'slug-tree:fs' }>;
      readonly TreePlayback: t.ActionProbe.ProbeSpec<TEnv, { readonly kind: 'slug-tree:media:seq' }>;
    };
  };

  export type Props = {
    origin?: t.StringUrl;
    dataset?: t.StringId;
    docid?: t.StringId;
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };
}
