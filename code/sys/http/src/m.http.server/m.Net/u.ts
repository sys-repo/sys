/**
 * Host-agnostic port utilities.
 * Probes IPv4 and IPv6 wildcards; no hostname required.
 */
export type ProbeResult =
  | { kind: 'ok' }
  | { kind: 'in_use' }
  | { kind: 'not_supported' }
  | { kind: 'denied' } // e.g. privileged port
  | { kind: 'unavailable' } // address not available on this host
  | { kind: 'other'; err: unknown };

let _ipv6Support: boolean | undefined;

/**
 * Detect once whether IPv6 is supported for binding.
 */
export function ipv6Supported(): boolean {
  if (_ipv6Support !== undefined) return _ipv6Support;
  try {
    const l = Deno.listen({ hostname: '::', port: 0 });
    l.close();
    _ipv6Support = true;
  } catch (err) {
    // Treat any failure as "no IPv6" for probing purposes.
    if (err instanceof Deno.errors.NotSupported) _ipv6Support = false;
    else if (err instanceof Deno.errors.AddrNotAvailable) _ipv6Support = false;
    else _ipv6Support = false;
  }
  return _ipv6Support;
}

/**
 * Attempt to bind the given host/port to check availability.
 */
export function probe(hostname: string, port: number): ProbeResult {
  try {
    const l = Deno.listen({ hostname, port });
    l.close();
    return { kind: 'ok' };
  } catch (err) {
    if (err instanceof Deno.errors.AddrInUse) return { kind: 'in_use' };
    if (err instanceof Deno.errors.NotSupported) return { kind: 'not_supported' };
    if (err instanceof Deno.errors.PermissionDenied) return { kind: 'denied' };
    if (err instanceof Deno.errors.AddrNotAvailable) return { kind: 'unavailable' };
    return { kind: 'other', err };
  }
}
