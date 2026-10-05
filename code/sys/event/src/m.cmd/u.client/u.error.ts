import type { t } from './common.ts';

/** Construct a client error with command context and an optional validated diagnostic. */
export const makeError = (args: {
  readonly kind: t.Cmd.Error.Kind;
  readonly message: string;
  readonly meta?: t.Cmd.Error.Meta;
  readonly cause?: t.Cmd.Error.Detail;
}): t.Cmd.Error.Instance => {
  const { kind, message, meta, cause } = args;

  const inner = cause ? { cause } : undefined;
  const err = new Error(message, inner) as t.DeepMutable<t.Cmd.Error.Instance>;
  err.name = kind;
  if (meta) {
    err.cmd = meta;
    err.ns = meta.ns;
  }

  return err;
};
