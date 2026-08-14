type ListenerAddress = {
  readonly hostname: string;
  readonly port: number;
  readonly addr: { readonly hostname: string };
};

type ExactListenerAddress = {
  readonly origin: string;
};

/** Derive the exact request Host authorities for one started loopback listener. */
export function acceptedAuthorities(started: ListenerAddress): ReadonlySet<string> {
  const authorities = new Set<string>();
  for (const hostname of ['localhost', started.hostname, started.addr.hostname]) {
    const host = normalizedHost(hostname);
    authorities.add(`${host}:${started.port}`);
    if (started.port === 80) authorities.add(host);
  }
  return authorities;
}

/** Derive the one exact canonical Host authority from the settled listener origin. */
export function exactAuthority(started: ExactListenerAddress): string {
  return new URL(started.origin).host.toLowerCase();
}

/** Admit one exact request Host authority. */
export function acceptsHost(request: Request, authorities: ReadonlySet<string>): boolean {
  const value = request.headers.get('host');
  return value !== null && value === value.trim() && authorities.has(value.toLowerCase());
}

function normalizedHost(hostname: string): string {
  return hostname.includes(':') ? `[${hostname.toLowerCase()}]` : hostname.toLowerCase();
}
