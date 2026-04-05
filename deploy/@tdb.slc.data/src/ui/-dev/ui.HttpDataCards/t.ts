import type { t } from './common.ts';

/** Type re-exports. */
export type * from '../common.t.ts';

/** Dev cards for probing staged SLC data over HTTP. */
export declare namespace HttpDataCards {
  export type DataCardKind = (typeof DataCardKindKinds)[number];
  export const DataCardKindKinds: readonly ['file-content'];

  export type RefState = {
    readonly ref: t.Signal<string | undefined>;
    readonly refs: t.Signal<string[] | undefined>;
  };

  export type SignalsProps = t.ActionProbe.SignalProps & {
    readonly selectionList: {
      readonly totalVisible: t.Signal<number | 'all' | undefined>;
    };
    readonly treeContent: RefState;
  };

  export type SignalsDefaults = {
    readonly totalVisible?: number | 'all';
    readonly treeContent?: { readonly ref?: string; readonly refs?: string[] };
    readonly action?: Parameters<t.ActionProbe.SignalsLib['create']>[0];
    readonly persist?: t.ImmutableRef<t.JsonMapU>;
    readonly persistKey?: string;
  };

  export type Signals = t.ActionProbe.Signals & {
    readonly props: SignalsProps;
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
    };
  };

  export type PanelArgs = {
    readonly signals: Signals;
    readonly origin: t.StringUrl;
    readonly dataset: t.StringId;
    readonly docid?: t.StringId;
    readonly theme?: t.CommonTheme;
    readonly debug?: boolean;
    readonly style?: t.CssInput;
  };

  export type Lib = {
    readonly UI: t.FC<Props>;
    readonly createSignals: (input?: SignalsDefaults) => Signals;
    readonly createPanel: (args: PanelArgs) => t.ReactNode;
    readonly Card: {
      readonly TreeContent: t.ActionProbe.ProbeSpec<TEnv, { readonly kind: 'slug-tree:fs' }>;
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
