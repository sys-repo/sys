import type { t } from './common.ts';

/**
 * Deterministic exact-marker text block primitives.
 */
export declare namespace TextBlock {
  export type Range = t.TextUpdate.Range;
  export type Newline = t.TextUpdate.Line.Newline;
  export type Change = t.TextUpdate.Change;

  export type Lib = {
    readonly detect: Detect;
    readonly render: Render;
    readonly update: Update;
    readonly edit: Edit;
    readonly remove: Remove;
  };

  export type Markers = {
    readonly start: string;
    readonly end: string;
  };

  export type InvalidReason =
    | 'invalid-markers'
    | 'partial-markers'
    | 'multiple-blocks'
    | 'reversed-markers';

  export type State =
    | { readonly kind: 'missing' }
    | {
      readonly kind: 'present';
      readonly range: Range;
      readonly contentRange: Range;
      readonly block: string;
      readonly content: string;
      readonly newline: Newline;
    }
    | {
      readonly kind: 'invalid';
      readonly reason: InvalidReason;
      readonly message: string;
    };

  export type PlanKind = 'add' | 'replace' | 'remove' | 'unchanged' | 'invalid';

  export type Plan = {
    readonly kind: PlanKind;
    readonly state: State;
    readonly changed: boolean;
    readonly before: string;
    readonly after: string;
    readonly changes: readonly Change[];
    readonly error?: t.TextUpdate.UpdateError;
  };

  export type Detect = (args: DetectArgs) => State;
  export type Render = (args: RenderArgs) => string;
  export type Update = (args: UpdateArgs) => Plan;
  export type Edit = (args: EditArgs) => Plan;
  export type Remove = (args: RemoveArgs) => Plan;

  export type DetectArgs = {
    readonly text: string;
    readonly markers: Markers;
  };

  export type RenderInput =
    | { readonly content?: string; readonly lines?: never }
    | { readonly lines: readonly string[]; readonly content?: never };

  export type RenderArgs = RenderInput & {
    readonly markers: Markers;
    readonly newline?: Newline;
  };

  export type UpdateArgs = RenderArgs & {
    readonly text: string;
  };

  export type RemoveArgs = DetectArgs;

  export type EditArgs = DetectArgs & {
    readonly onMissing?: 'ignore' | 'add';
    readonly edit: (ctx: EditContext) => string | t.TextUpdate.Result | undefined | void;
  };

  export type EditContext = {
    readonly state: State;
    readonly content: string;
    readonly newline: Newline;
  };
}
