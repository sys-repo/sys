import { Schema, type t } from '../common.ts';

const CanonicalText = Schema.Type.String({
  minLength: 1,
  pattern: '^(?!\\s)(?!.*\\s$)[^\\u0000-\\u001F\\u007F-\\u009F\\u2028\\u2029]+$',
});
const Integrity = Schema.Type.String({ pattern: '^sha256-[0-9a-f]{64}$' });
const LoopbackHostname = Schema.Type.Union([
  Schema.Type.Literal('127.0.0.1'),
  Schema.Type.Literal('localhost'),
  Schema.Type.Literal('::1'),
]);
const SafeInteger = { maximum: Number.MAX_SAFE_INTEGER } as const;

export type DistServiceConfigDoc = {
  readonly name?: string;
  readonly dir: string;
  readonly integrity: string;
  readonly limits: {
    readonly manifestBytes: number;
    readonly entries: number;
    readonly fileBytes: number;
    readonly totalBytes: number;
  };
  readonly hostname?: '127.0.0.1' | 'localhost' | '::1';
  readonly port?: number;
};

/** Strict DistService YAML schema and normalization. */
export const DistServiceConfigSchema = Object.freeze(
  {
    validate(value: unknown) {
      const ok = Schema.Value.Check(DistServiceConfigSchema.schema, value);
      const errors = ok ? [] : [...Schema.Value.Errors(DistServiceConfigSchema.schema, value)];
      return { ok, errors } as const;
    },

    normalize(doc: DistServiceConfigDoc): t.DistService.Config {
      const limits = Object.freeze({ ...doc.limits }) as t.FsPkg.Dist.Pinned.Verify.Limits;
      return Object.freeze({
        ...(doc.name === undefined ? {} : { name: doc.name }),
        dir: doc.dir as t.StringDir,
        integrity: doc.integrity as t.StringHash,
        limits,
        ...(doc.hostname === undefined ? {} : { hostname: doc.hostname }),
        ...(doc.port === undefined ? {} : { port: doc.port as t.PortNumber }),
      });
    },

    schema: Schema.Type.Object(
      {
        name: Schema.Type.Optional(CanonicalText),
        dir: CanonicalText,
        integrity: Integrity,
        limits: Schema.Type.Object(
          {
            manifestBytes: Schema.Type.Integer({ minimum: 1, ...SafeInteger }),
            entries: Schema.Type.Integer({ minimum: 1, ...SafeInteger }),
            fileBytes: Schema.Type.Integer({ minimum: 0, ...SafeInteger }),
            totalBytes: Schema.Type.Integer({ minimum: 0, ...SafeInteger }),
          },
          { additionalProperties: false },
        ),
        hostname: Schema.Type.Optional(LoopbackHostname),
        port: Schema.Type.Optional(Schema.Type.Integer({ minimum: 0, maximum: 65_535 })),
      },
      { additionalProperties: false },
    ),
  } as const,
);
