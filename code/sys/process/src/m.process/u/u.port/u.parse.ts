import { Is, Num, type t } from '../../common.ts';

/**
 * Parse `lsof -Fpcn` output into TCP listener facts.
 */
export function parseLsof(
  text: string,
  target: t.Process.Port.Target,
): readonly t.Process.Port.Listener[] {
  const listeners: t.Process.Port.Listener[] = [];
  let pid: number | undefined;
  let command: string | undefined;

  for (const raw of text.split(/\r?\n/)) {
    if (raw.length === 0) continue;

    const field = raw[0];
    const value = raw.slice(1);

    if (field === 'p') {
      pid = Number(value);
      command = undefined;
      continue;
    }

    if (field === 'c') {
      command = value;
      continue;
    }

    if (field !== 'n' || pid === undefined || !Num.Is.safeInt(pid)) continue;

    const address = listenAddress(value);
    if (!address || address.port !== target.port) continue;
    if (!hostMatches(address.host, target.host)) continue;

    listeners.push(listener({ pid, command, name: value, address }));
  }

  return listeners;
}

/**
 * Parse `ss -H -ltnp` output into TCP listener facts.
 */
export function parseSs(
  text: string,
  target: t.Process.Port.Target,
): readonly t.Process.Port.Listener[] {
  const listeners: t.Process.Port.Listener[] = [];

  for (const line of text.split(/\r?\n/)) {
    const value = line.trim();
    if (value.length === 0) continue;

    const pid = ssPid(value);
    const address = listenAddress(ssLocalAddress(value));
    if (pid === undefined || !address || address.port !== target.port) continue;
    if (!hostMatches(address.host, target.host)) continue;

    listeners.push(
      listener({ pid, command: ssCommand(value), name: ssLocalAddress(value), address }),
    );
  }

  return listeners;
}

function ssPid(line: string) {
  const match = /\bpid=(\d+)\b/.exec(line);
  if (!match) return undefined;
  const pid = Number(match[1]);
  return Num.Is.safeInt(pid) ? pid : undefined;
}

function ssCommand(line: string) {
  return /"([^"]+)"/.exec(line)?.[1];
}

function ssLocalAddress(line: string) {
  return line.split(/\s+/)[3] ?? '';
}

function listenAddress(name: string): { host?: string; port: number } | undefined {
  const value = name.replace(/\s+\(LISTEN\)$/i, '').replace(/^TCP\s+/i, '').trim();
  const bracket = /^\[([^\]]+)\]:(\d+)$/.exec(value);
  if (bracket) return { host: bracket[1], port: Number(bracket[2]) };

  const index = value.lastIndexOf(':');
  if (index < 0) return undefined;

  const host = value.slice(0, index);
  const port = Number(value.slice(index + 1));
  if (!Num.Is.safeInt(port)) return undefined;
  return host ? { host, port } : { port };
}

function hostMatches(listener: string | undefined, target: string | undefined) {
  if (target === undefined) return true;
  if (listener === undefined) return false;
  if (listener === target) return true;
  if (isWildcardHost(listener)) return true;
  if (isLoopbackHost(listener) && isLoopbackHost(target)) return true;
  return false;
}

function isWildcardHost(host: string) {
  return host === '*' || host === '0.0.0.0' || host === '::';
}

function isLoopbackHost(host: string) {
  return Is.localhost(`http://${urlHost(host)}`);
}

function urlHost(host: string) {
  return host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;
}

function listener(input: {
  pid: number;
  command?: string;
  name: string;
  address: { host?: string; port: number };
}): t.Process.Port.Listener {
  const { address, command, name, pid } = input;
  return {
    pid,
    protocol: 'tcp',
    port: address.port,
    name,
    ...(address.host ? { host: address.host } : {}),
    ...(command ? { command } : {}),
  };
}
