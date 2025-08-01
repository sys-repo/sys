import { Type } from '../common.ts';

/**
 * Content section (chapter):
 *
 *    { "Customer Model": string | null | { summary?: string } }
 *    ^ any key          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ allowed values
 */
export const Section = Type.Record(
  Type.String(), // any property name
  Type.Union([
    Type.String(), // "hello"
    Type.Null(), // null   (YAML:  Customer Model:)
    Type.Object(
      { summary: Type.Optional(Type.String()) },
      {
        additionalProperties: false, // reject extra props inside the object
      },
    ),
  ]),
);
