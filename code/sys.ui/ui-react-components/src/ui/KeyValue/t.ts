import type React from 'react';
import type { t } from '../common.ts';

/**
 * Item kinds.
 */
export type KeyValueItem = KeyValueRow | KeyValueTitle | KeyValueHr | KeyValueSpacer;

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
  ): readonly KeyValueItem[];
};

/**
 * Component: Props for the <KeyValue> component.
 */
export type KeyValueProps = {
  items?: readonly KeyValueItem[];
  columns?: KeyValuePropsColumns;
  size?: 'xs' | 'sm' | 'md';
  mono?: boolean;
  truncate?: boolean;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/** Configuration for how columns are laid out. */
export type KeyValuePropsColumns = { template?: string; gap?: t.Pixels };

/**
 * A single key/value row.
 */
export type KeyValueRow = {
  readonly kind: 'row';
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
  readonly node: React.ReactNode;
};

/**
 * A horizontal divider (<hr>).
 */
export type KeyValueHr = {
  readonly kind: 'hr';
  readonly inset?: number;
};

/**
 * A vertical spacer (extra gap between groups).
 */
export type KeyValueSpacer = {
  readonly kind: 'spacer';
  readonly size?: number | string; // default: 8
};
