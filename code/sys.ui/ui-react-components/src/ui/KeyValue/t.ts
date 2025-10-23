import type React from 'react';
import type { t } from '../common.ts';

/** Item kinds. */
export type KeyValueItem = KeyValueRow | KeyValueTitle | KeyValueHr | KeyValueSpacer;
/** Size flags. */
export type KeyValueSize = 'xs' | 'sm' | 'md';

/**
 * Types for the KeyValue primitive.
 * A minimal table for rendering key/value data with optional titles and dividers.
 */
export type KeyValueLib = {
  readonly View: React.FC<t.KeyValueProps>;
  fromObject(
    obj: Record<string, unknown>,
    options?: {
      filter?: (key: string, value: unknown) => boolean;
      format?: (value: unknown) => React.ReactNode;
    },
  ): KeyValueItem[];
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
export type KeyValueLayout = {
  variant?: 'inline' | 'table';
  keyMax?: string | t.Pixels;
  keyAlign?: 'left' | 'right';
  columnGap?: t.Pixels;
  rowGap?: t.Pixels;
  align?: 'baseline' | 'start' | 'center';
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
};

/**
 * A section title.
 */
export type KeyValueTitle = {
  readonly kind: 'title';
  readonly v: React.ReactNode;
};

/**
 * A horizontal divider (<hr>).
 */
export type KeyValueHr = {
  readonly kind: 'hr';
  readonly x?: t.Pixels | [t.Pixels, t.Pixels]; // [left, right]
  readonly y?: t.Pixels | [t.Pixels, t.Pixels]; // [top, bottom]
  readonly thickness?: t.Pixels;
  readonly opacity?: t.Percent;
};

/**
 * A vertical spacer (extra gap between groups).
 */
export type KeyValueSpacer = {
  readonly kind: 'spacer';
  readonly size?: number | string;
};
