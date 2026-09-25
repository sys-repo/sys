import { type t } from './common.ts';

/**
 * Value-only recipe surface for CSS-related patterns.
 * Compile to concrete TypeBox at the edge via `toSchema`.
 */
export type CssSpecLib = {
  /**
   * CSS margin shorthand:
   * - number (pixels, >= 0)
   * - string (e.g., "0", "8", "8 12", "8 12 16 4", "8px 12px", "1rem", "0 0 0 0")
   */
  Margin(): t.Schema.Spec.Union;
};

/**
 * Value-only recipe surface for Cropmarks.
 * Compile to concrete TypeBox at the edge via `toSchema`.
 */
export type CropmarksSpecLib = {
  /** 0..100 (inclusive) */
  Percent(): t.Schema.Spec.Num;

  /** 'center' | 'fill' | 'percent' */
  SizeMode(): t.Schema.Spec.Union;

  /** { mode:'center', width?:number>=0, height?:number>=0 } */
  SizeCenter(): t.Schema.Spec.Obj;

  /** { mode:'fill', x?:boolean, y?:boolean, margin?:Css.Margin } */
  SizeFill(): t.Schema.Spec.Obj;

  /**
   * {
   *   mode:'percent',
   *   width?:0..100, height?:0..100,
   *   aspectRatio?: string | number>0,
   *   maxWidth?:0..100, maxHeight?:0..100,
   *   margin?:Css.Margin
   * }
   */
  SizePercent(): t.Schema.Spec.Obj;

  /** Union of SizeCenter | SizeFill | SizePercent (discriminated by `mode`) */
  Size(): t.Schema.Spec.Union;
};
