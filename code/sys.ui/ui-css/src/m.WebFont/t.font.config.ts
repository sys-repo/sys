import { type t } from './common.ts';

/**
 * Web-font configuration options.
 */
export type WebFontConfig = {
  readonly family: string;
  readonly variable?: boolean; // default: true
  readonly weights?: readonly t.FontWeight[]; // when variable=false; default: [400]
  readonly italic?: boolean; // default: false
  readonly display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional'; // default: 'swap'
  readonly local?: readonly string[];
  readonly fileForStatic?: (p: {
    family: string;
    weight: t.FontWeight;
    italic: boolean;
    dir: t.StringDir;
  }) => string;
  readonly fileForVariable?: (p: { family: string; italic: boolean; dir: string }) => string;
};
