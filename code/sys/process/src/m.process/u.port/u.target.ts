import { Is, Num, type t } from '../common.ts';

/**
 * Normalize and validate a TCP listener target.
 */
export function targetOf(input: t.Process.Port.Input): t.Process.Port.Target {
  if (Is.num(input)) return { protocol: 'tcp', port: portNumber(input) };
  if (!Is.record(input)) throw invalidTarget(input);

  const protocol = input.protocol ?? 'tcp';
  if (protocol !== 'tcp') {
    throw new Error(`Process.Port: unsupported protocol: ${String(protocol)}.`);
  }

  const port = portNumber(input.port);
  const host = hostOf(input.host);
  return host ? { protocol, port, host } : { protocol, port };
}

function portNumber(input: unknown) {
  if (!Is.num(input) || !Num.Is.safeInt(input) || input < 1 || input > 65_535) {
    throw new Error(`Process.Port: invalid port: ${String(input)}.`);
  }
  return input;
}

function hostOf(input: unknown) {
  if (input === undefined) return undefined;
  if (!Is.str(input) || input.trim().length === 0) {
    throw new Error(`Process.Port: invalid host: ${String(input)}.`);
  }
  return input.trim();
}

function invalidTarget(input: unknown) {
  return new Error(`Process.Port: invalid target: ${String(input)}.`);
}
