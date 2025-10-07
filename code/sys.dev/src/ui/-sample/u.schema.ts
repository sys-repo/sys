import { type t, Type } from './common.ts';

/**
 * Meta-data:
 */
export const Meta = Type.Object({
  dev: Type.Optional(
    Type.Boolean({
      description: 'Flag indicating if the dev/debug column should be showing.',
      default: false,
    }),
  ),

  /** Main */
  main: Type.Optional(
    Type.Object({
      component: Type.Optional(Type.String({ description: 'URI passed to the view-factory.' })),
      props: Type.Optional(
        Type.String({
          description: `String that resolves to an object-path pointing locally to the 'props' data in the document.`,
        }),
      ),
    }),
  ),
});

export type MetaSchema = t.Static<typeof Meta>;
