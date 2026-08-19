/** Required bounds for retained launcher authority strings, measured in UTF-16 code units. */
export const AUTHORITY_LIMITS = Object.freeze({
  manifestUrl: 4096,
  developmentDir: 4096,
  integrity: 'sha256-'.length + 64,
  packageName: 256,
  packageVersion: 256,
});

/** Required bounds for Driver Pi Dist verification. */
export const LIMITS = Object.freeze({
  manifestBytes: 16 * 1024 * 1024, //   ← 16 MB
  entries: 4096 * 2 + 1, //             ← 8,193 entries
  fileBytes: 128 * 1024 * 1024, //      ← 128 MB
  totalBytes: 1024 * 1024 * 1024, //    ← 1,024 MB (1 GB)
});
