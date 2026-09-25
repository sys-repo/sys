import { D, Schema, type t } from '../common.ts';

const NonBlankString = Schema.Type.String({ minLength: 1, pattern: '\\S' });

export type FilesWebSocketServiceConfigDoc = {
  readonly name?: string;
  readonly root: string;
  readonly hostname?: string;
  readonly port?: number;
  readonly path?: string;
  readonly policy?: string;
  readonly watch?: boolean;
};

/**
 * Files WebSocket service YAML schema and normalization helpers.
 */
export const FilesWebSocketServiceConfigSchema = Object.freeze(
  {
    /**
     * Runtime validation (strict, no coercion).
     */
    validate(value: unknown) {
      const ok = Schema.Value.Check(FilesWebSocketServiceConfigSchema.schema, value);
      const errors = ok
        ? []
        : [...Schema.Value.Errors(FilesWebSocketServiceConfigSchema.schema, value)];
      return { ok, errors } as const;
    },

    /**
     * Normalize a schema-valid YAML document into the service config contract.
     */
    normalize(doc: FilesWebSocketServiceConfigDoc): t.FilesWebSocketService.Config {
      const name = trimOptional(doc.name);
      const hostname = trimOptional(doc.hostname) as t.StringHostname | undefined;
      const port = doc.port as t.PortNumber | undefined;

      return {
        ...(name === undefined ? {} : { name }),
        root: doc.root.trim(),
        ...(hostname === undefined ? {} : { hostname }),
        ...(port === undefined ? {} : { port }),
        path: (doc.path?.trim() ?? D.path) as t.StringUrlRoute,
        policy: (doc.policy?.trim() ?? '**') as t.Files.Match,
        watch: doc.watch ?? false,
      };
    },

    /**
     * JsonSchema.
     */
    schema: Schema.Type.Object(
      {
        name: Schema.Type.Optional(NonBlankString),
        root: NonBlankString,
        hostname: Schema.Type.Optional(NonBlankString),
        port: Schema.Type.Optional(Schema.Type.Integer({ minimum: 0, maximum: 65535 })),
        path: Schema.Type.Optional(Schema.Type.String({ minLength: 1, pattern: '^\\s*/' })),
        policy: Schema.Type.Optional(NonBlankString),
        watch: Schema.Type.Optional(Schema.Type.Boolean()),
      },
      { additionalProperties: false },
    ),
  } as const,
);

/**
 * Helpers:
 */
function trimOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
