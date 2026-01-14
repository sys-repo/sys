export type ProbeCheckResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: unknown };
