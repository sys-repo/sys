import { type t, V } from './common.ts';
import { Css } from './u.ui.Css.ts';

/**
 * Cropmarks recipes (value-only).
 * Compile with `toSchema` at the boundary.
 */
export const Cropmarks: t.CropmarksSpecLib = {
  /** 0..100 inclusive */
  Percent() {
    return V.number({
      minimum: 0,
      maximum: 100,
      description: 'Percent 0..100',
    });
  },

  /** 'center' | 'fill' | 'percent' */
  SizeMode() {
    return V.union([V.literal('center'), V.literal('fill'), V.literal('percent')], {
      description: 'Cropmarks size mode',
    });
  },

  /** { mode:'center', width?:>=0, height?:>=0 } (strict) */
  SizeCenter() {
    return V.object(
      {
        mode: V.literal('center'),
        width: V.optional(V.number({ minimum: 0 })),
        height: V.optional(V.number({ minimum: 0 })),
      },
      {
        additionalProperties: false,
        description: 'Center the subject; width/height in pixels (optional).',
      },
    );
  },

  /** { mode:'fill', x?:boolean, y?:boolean, margin?:Css.Margin } (strict) */
  SizeFill() {
    return V.object(
      {
        mode: V.literal('fill'),
        x: V.optional(V.boolean()),
        y: V.optional(V.boolean()),
        margin: V.optional(Css.Margin()),
      },
      {
        additionalProperties: false,
        description: 'Fill along one or both axes, with optional pixel/CSS margin.',
      },
    );
  },

  /**
   * { mode:'percent', width/height/maxWidth/maxHeight in 0..100; aspectRatio string|"w/h"|number>0 } (strict)
   */
  SizePercent() {
    const p = this.Percent();
    return V.object(
      {
        mode: V.literal('percent'),
        width: V.optional(p),
        height: V.optional(p),
        margin: V.optional(Css.Margin()),
        aspectRatio: V.optional(
          V.union([V.string(), V.number({ exclusiveMinimum: 0 })], {
            description: 'String like "16/9" or positive number (e.g., 1.618)',
          }),
        ),
        maxWidth: V.optional(p),
        maxHeight: V.optional(p),
      },
      {
        additionalProperties: false,
        description:
          'Percent-based sizing (0..100). aspectRatio applies when only one axis is provided.',
      },
    );
  },

  /** Union(discriminated by `mode`) */
  Size() {
    return V.union([this.SizeCenter(), this.SizeFill(), this.SizePercent()], {
      description: 'CropmarksSize (discriminated by "mode")',
    });
  },
};
