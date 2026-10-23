type ListenerAddress = {
  readonly hostname: string;
  readonly port: number;
  readonly addr: { readonly hostname: string };
};

type ExactListenerAddress = {
  readonly origin: string;
};

/** Derive admitted request Host authorities for one settled loopback listener. */
export function acceptedAuthorities(started: ListenerAddress): ReadonlySet<string> {
  const authorities = new Set<string>();
  for (const hostname of ['localhost', started.hostname, started.addr.hostname]) {
    const host = normalizedHost(hostname);
    authorities.add(`${host}:${started.port}`);
    if (started.port === 80) authorities.add(host);
  }
  return authorities;
}

/** Derive the one exact canonical Host authority from a settled listener origin. */
export function exactAuthority(started: ExactListenerAddress): string {
  return new URL(started.origin).host.toLowerCase();
}

/** Admit one request carrying an exact settled Host authority. */
export function acceptsHost(request: Request, authorities: ReadonlySet<string>): boolean {
  const value = request.headers.get('host');
  return value !== null && value === value.trim() && authorities.has(value.toLowerCase());
}

/** Admit Fetch Metadata values accepted by loopback browser-response policies. */
export function acceptsFetchSite(request: Request): boolean {
  const value = request.headers.get('sec-fetch-site');
  if (value === null) return true;
  return value === 'same-origin' || value === 'same-site' || value === 'none';
}

function normalizedHost(hostname: string): string {
  return hostname.includes(':') ? `[${hostname.toLowerCase()}]` : hostname.toLowerCase();
}
