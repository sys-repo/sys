/** Required bounds for Driver Pi Dist verification. */
export const LIMITS = {
  manifestBytes: 16 * 1024 * 1024, //   ← 16 MB
  entries: 4096 * 2 + 1, //             ← 8,193 entries
  fileBytes: 128 * 1024 * 1024, //      ← 128 MB
  totalBytes: 1024 * 1024 * 1024, //    ← 1,024 MB (1 GB)
} as const;
