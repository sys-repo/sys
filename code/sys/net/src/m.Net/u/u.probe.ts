import { Host } from './u.host.ts';

/** Minimal TCP listener boundary shared by selection and its deterministic tests. */
export type PortListen = (
  options: Deno.ListenOptions & { port: number },
) => Pick<Deno.Listener, 'addr' | 'close'>;

export type ProbeResult =
  | Readonly<{ kind: 'ok' }>
  | Readonly<{ kind: 'in_use'; err: unknown }>
  | Readonly<{ kind: 'not_supported'; err: unknown }>
  | Readonly<{ kind: 'denied'; err: unknown }>
  | Readonly<{ kind: 'unavailable'; err: unknown }>
  | Readonly<{ kind: 'other'; err: unknown }>;

/** Internal probe owner; only established IPv6 capability facts are cached. */
export function createPortProbe(listen: PortListen) {
  let ipv6Support: boolean | undefined;

  function probe(hostname: string, port: number): ProbeResult {
    let listener: ReturnType<PortListen>;
    try {
      listener = listen({ hostname, port });
    } catch (err) {
      if (err instanceof Deno.errors.AddrInUse) return { kind: 'in_use', err };
      if (err instanceof Deno.errors.NotSupported) return { kind: 'not_supported', err };
      if (err instanceof Deno.errors.PermissionDenied || err instanceof Deno.errors.NotCapable) {
        return { kind: 'denied', err };
      }
      if (err instanceof Deno.errors.AddrNotAvailable) return { kind: 'unavailable', err };
      return { kind: 'other', err };
    }

    try {
      listener.close();
      return { kind: 'ok' };
    } catch (err) {
      // Cleanup failure is never evidence of conflict or unsupported address families.
      return { kind: 'other', err };
    }
  }

  function ipv6Supported(): boolean {
    if (ipv6Support !== undefined) return ipv6Support;
    const result = probe(Host.ipv6.wildcard, 0);
    if (result.kind === 'ok') return ipv6Support = true;
    if (result.kind === 'not_supported') return ipv6Support = false;
    // Keep refusals uncached and preserve the substrate error, including permission identity.
    throw result.err;
  }

  return Object.freeze({
    probe,
    targets(): readonly string[] {
      const targets: string[] = [Host.ipv4.wildcard, Host.ipv4.loopback];
      if (ipv6Supported()) targets.push(Host.ipv6.wildcard, Host.ipv6.loopback);
      return targets;
    },
  });
}
