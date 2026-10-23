/** Test-only written-product attestation; no package API. */
export type IntegrityReference = {
  readonly kind: 'module' | 'stylesheet' | 'modulepreload';
  readonly url: string;
  readonly path: string;
  readonly digest: string;
};

export type IntegrityProduct = {
  readonly html: string;
  readonly references: readonly IntegrityReference[];
  readonly external: readonly string[];
};
