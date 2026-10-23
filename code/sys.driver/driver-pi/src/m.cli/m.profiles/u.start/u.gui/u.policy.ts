/** Shared admission bounds; importing policy does not acquire GUI runtime dependencies. */
export const AUTHORITY_LIMITS = Object.freeze({
  manifestUrl: 4096,
  developmentDir: 4096,
});

/** The binder and running service use the same immutable verification limits. */
export const VERIFY_LIMITS = Object.freeze({
  manifestBytes: 16 * 1024 * 1024,
  entries: 4096 * 2 + 1,
  fileBytes: 128 * 1024 * 1024,
  totalBytes: 1024 * 1024 * 1024,
});
