export function isMissingBinaryError(err: unknown) {
  const msg = (err instanceof Error ? err.message : String(err ?? '')).toLowerCase();
  return (
    msg.includes('not found') ||
    msg.includes('enoent') ||
    msg.includes('no such file') ||
    msg.includes('cannot find')
  );
}
