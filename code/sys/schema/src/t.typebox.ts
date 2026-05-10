/**
 * TypeBox surfaces exported under the @sys/schema package authority.
 */
import type { TLocalizedValidationError } from 'typebox/error';
import type * as typebox from 'typebox';
import type * as typeboxValue from 'typebox/value';

export type { Static } from 'typebox';

export type * from './t.typebox.primitives.ts';

/** TypeBox runtime surfaces as named by @sys/schema. */
export declare namespace Typebox {
  /** Runtime schema-constructor surface exposed as `Schema.Type` / `Type`. */
  export type Lib = Type.Lib;

  export namespace Type {
    /** Recursive builder exposed by @sys/schema over TypeBox Cyclic. */
    export type Recursive = <const Schema extends typebox.TSchema>(
      callback: (thisType: typebox.TRef<string>) => Schema,
      options?: typebox.TSchemaOptions,
    ) => typebox.TCyclic<Record<string, Schema> & typebox.TProperties, string>;

    /** Runtime Type builder exposed by @sys/schema. */
    export type Lib = typeof typebox.Type & {
      readonly Recursive: Recursive;
    };
  }

  export namespace Value {
    /** TypeBox validation error normalized to the @sys/schema diagnostic surface. */
    export type Error = TLocalizedValidationError & {
      readonly path: string;
      /** Failing schema evidence when it can be resolved from the schema graph. */
      readonly schema: typebox.TSchema & { readonly title?: string };
      /** Failing value evidence resolved from the diagnostic path. */
      readonly value: unknown;
      /** Nested diagnostic slot; TypeBox localized errors are flat. */
      readonly errors: readonly ErrorList[];
    };

    /** Array-compatible diagnostic list returned by @sys/schema Value.Errors. */
    export type ErrorList = Error[] & {
      /** Returns the first value error or undefined if no errors exist. */
      readonly First: () => Error | undefined;
    };

    /** Runtime Value helpers exposed by @sys/schema, including normalized errors. */
    export type Lib = Omit<typeof typeboxValue.Value, 'Assert' | 'Errors' | 'Parse'> & {
      readonly Assert: {
        <const Schema extends typebox.TSchema>(
          type: Schema,
          value: unknown,
        ): asserts value is typebox.Static<Schema>;
        <Context extends typebox.TProperties, const Schema extends typebox.TSchema>(
          context: Context,
          type: Schema,
          value: unknown,
        ): asserts value is typebox.Static<Schema, Context>;
      };
      readonly Errors: {
        <Schema extends typebox.TSchema>(type: Schema, value: unknown): ErrorList;
        <Context extends typebox.TProperties, Schema extends typebox.TSchema>(
          context: Context,
          type: Schema,
          value: unknown,
        ): ErrorList;
      };
      readonly Parse: {
        <const Schema extends typebox.TSchema>(
          type: Schema,
          value: unknown,
        ): typebox.StaticParse<Schema>;
        <Context extends typebox.TProperties, const Schema extends typebox.TSchema>(
          context: Context,
          type: Schema,
          value: unknown,
        ): typebox.StaticParse<Schema, Context>;
      };
    };
  }
}

/** Public diagnostic alias exposed by @sys/schema. */
export type ValueError = Typebox.Value.Error;

/** Public diagnostic-list alias exposed by @sys/schema. */
export type ValueErrorList = Typebox.Value.ErrorList;
