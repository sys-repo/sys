import type React from 'react';
import type { t } from '../common.ts';

/** Size flags. */
export type KeyValueSize = 'xs' | 'sm' | 'md';
/** Item kinds. */
export type KeyValueItem = KeyValueRow | KeyValueTitle | KeyValueHr | KeyValueSpacer;
/** Spacing offset around an item. */
export type KeyValueSpacing = t.Pixels | [t.Pixels, t.Pixels] | readonly [t.Pixels, t.Pixels];

/**
 * Types for the KeyValue primitive.
 * A minimal table for rendering key/value data with optional titles and dividers.
 */
export type KeyValueLib = {
  readonly View: React.FC<t.KeyValueProps>;
  fromObject: KeyValueFromObject;
};

/**
 * Component: props for the <KeyValue> component.
 */
export type KeyValueProps = {
  items?: KeyValueItem[];

  layout?: KeyValueLayout;
  size?: KeyValueSize;
  mono?: boolean;
  truncate?: boolean;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component: props for a single row within the <KeyValue> component.
 */
export type KeyValueItemProps = {
  item: t.KeyValueItem;
  mono?: boolean;
  truncate?: boolean;
  layout?: t.KeyValueLayout;
  size?: t.KeyValueSize;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Layout config for key/value rows.
 */
export type KeyValueLayout = KeyValueLayoutSpaced | KeyValueLayoutTable;
export type KeyValueLayoutSpaced = KeyValueLayoutCommon & { kind: 'spaced' };
export type KeyValueLayoutTable = KeyValueLayoutCommon & {
  kind: 'table';
  keyMax?: string | t.Pixels;
  keyAlign?: 'left' | 'right';
};
export type KeyValueLayoutCommon = {
  columnGap?: t.Pixels;
  rowGap?: t.Pixels;
  align?: 'baseline' | 'start' | 'center' | 'end';
};

/**
 * A single key/value row.
 */
export type KeyValueRow = {
  readonly kind?: 'row';
  readonly k: React.ReactNode;
  readonly v?: React.ReactNode;
  readonly mono?: boolean;
  readonly truncate?: boolean;
  readonly x?: KeyValueSpacing; // spacing: [left, right]
  readonly y?: KeyValueSpacing; // spacing: [top, bottom]
};

/**
 * A section title.
 */
export type KeyValueTitle = {
  readonly kind: 'title';
  readonly v: React.ReactNode;
  readonly x?: KeyValueSpacing; // spacing: [left, right]
  readonly y?: KeyValueSpacing; // spacing: [top, bottom]
};

/**
 * A horizontal divider (<hr>).
 */
export type KeyValueHr = {
  readonly kind: 'hr';
  readonly thickness?: t.Pixels;
  readonly opacity?: t.Percent;
  readonly x?: KeyValueSpacing; // spacing: [left, right]
  readonly y?: KeyValueSpacing; // spacing: [top, bottom]
};

/**
 * A vertical spacer (extra gap between groups).
 */
export type KeyValueSpacer = {
  readonly kind: 'spacer';
  readonly size?: number | string;
};

/**
 * Build `KeyValueItem[]` rows from a plain object.
 */
export type KeyValueFromObject = (
  obj?: Record<string, unknown>,
  options?: KeyValueFromObjectOptions,
) => KeyValueItem[];
/** Options for the `KeyValue.fromObject` method. */
export type KeyValueFromObjectOptions = {
  filter?: (key: string, value: unknown) => boolean;
  format?: (value: unknown) => React.ReactNode;
};
