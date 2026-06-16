import type React from 'react';
import type { t } from '../common.ts';

/**
 * Types for the KeyValue primitive.
 * A minimal table for rendering key/value data with optional titles and dividers.
 */
export declare namespace KeyValue {
  /** Size flags. */
  export type Size = 'xs' | 'sm' | 'md';

  /** Item kinds. */
  export type Item = Row | Title | Hr | Spacer;

  /** Spacing offset around an item. */
  export type Spacing = t.Pixels | [t.Pixels, t.Pixels] | readonly [t.Pixels, t.Pixels];

  /**
   * Optional opacity overrides for key/value pairs.
   * - Single number: applied uniformly to both key and value.
   * - Object: per-side overrides (k = key, v = value).
   */
  export type Opacity = t.Percent | { readonly k?: t.Percent; readonly v?: t.Percent };

  export type LinkOpen = 'new-tab' | 'inline';
  export type LinkDisplay = 'raw' | 'trim-http';

  export type Defaults = {
    /**
     * Opacity applied to value-side cells (`v`) when `enabled` is false.
     * Key-side styling remains unchanged by default.
     */
    readonly disabledOpacity?: t.Percent;
  };

  export type LinkProps = {
    readonly href?: t.StringUri;
    readonly infer?: boolean;
    readonly open?: LinkOpen;
    readonly display?: LinkDisplay;
    readonly rel?: string;
  };

  export type LinkDef = boolean | t.StringUri | LinkProps;
  export type Href = LinkDef | { readonly k?: LinkDef; readonly v?: LinkDef };

  /** Public module surface. */
  export type Lib = {
    readonly UI: React.FC<Props>;
    readonly Switches: t.KeyValueSwitches.Lib;
    fromObject: FromObject;
  };

  /** Component props for the <KeyValue> component. */
  export type Props = {
    items?: Item[];

    layout?: Layout;
    size?: Size;
    mono?: boolean;
    truncate?: boolean;
    selectable?: boolean;
    enabled?: boolean;
    defaults?: Defaults;

    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };

  /** Component props for a single row within the <KeyValue> component. */
  export type ItemProps = {
    item: Item;
    enabled?: boolean;
    disabledOpacity?: t.Percent;
    mono?: boolean;
    truncate?: boolean;
    layout?: Layout;
    size?: Size;
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };

  /** Layout config for key/value rows. */
  export type Layout = LayoutSpaced | LayoutTable;
  export type LayoutSpaced = LayoutCommon & { kind: 'spaced' };
  export type LayoutTable = LayoutCommon & {
    kind: 'table';
    keyMax?: string | t.Pixels;
    keyAlign?: 'left' | 'right';
  };
  export type LayoutCommon = {
    columnGap?: t.Pixels;
    rowGap?: t.Pixels;
    align?: 'baseline' | 'start' | 'center' | 'end';
  };

  /** A single key/value row. */
  export type Row = {
    readonly kind?: 'row';
    readonly k: React.ReactNode;
    readonly v?: React.ReactNode;
    readonly mono?: boolean;
    readonly truncate?: boolean;
    readonly x?: Spacing; // spacing: [left, right]
    readonly y?: Spacing; // spacing: [top, bottom]
    /**
     * Row-level opacity overrides.
     * - Number: dims both key and value by this factor.
     * - Object: per-side overrides (k = key, v = value).
     */
    readonly opacity?: Opacity;
    /**
     * Optional link wrapper for row cells.
     * - `string`/`boolean`/props object → applies to `v` (value) side by default.
     * - `{ k, v }` → per-side configuration.
     */
    readonly href?: Href;

    /** Row-level `user-select` overrides. */
    userSelect?: t.CssProps['userSelect'];
  };

  /** A section title. */
  export type Title = {
    readonly kind: 'title';
    readonly v: React.ReactNode | [React.ReactNode, React.ReactNode];
    readonly x?: Spacing; // spacing: [left, right]
    readonly y?: Spacing; // spacing: [top, bottom]
  };

  /** A horizontal divider (<hr>). */
  export type Hr = {
    readonly kind: 'hr';
    readonly thickness?: t.Pixels;
    readonly opacity?: t.Percent;
    readonly x?: Spacing; // spacing: [left, right]
    readonly y?: Spacing; // spacing: [top, bottom]
  };

  /** A vertical spacer (extra gap between groups). */
  export type Spacer = {
    readonly kind: 'spacer';
    readonly size?: number | string;
  };

  /** Build `Item[]` rows from a plain object. */
  export type FromObject = (obj?: Record<string, unknown>, options?: FromObjectOptions) => Item[];

  /** Options for the `KeyValue.fromObject` method. */
  export type FromObjectOptions = {
    filter?: (key: string, value: unknown) => boolean;
    format?: (value: unknown) => React.ReactNode;
  };
}
