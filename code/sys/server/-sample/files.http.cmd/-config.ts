import { D, Files, Fs, Num, type t } from './common.ts';

const root = Fs.Path.fromFileUrl(new URL('./docs', import.meta.url));
const policy = Files.Policy.readonly('**');
const port = readPort(D.env.port) ?? D.port;

/** Sample-owned config for the Files HTTP Cmd server. */
export const SampleFiles = {
  name: D.name,
  port,
  path: D.path,
  root,
  policy,
} as const;

/**
 * Helpers:
 */
function readPort(name: string): t.PortNumber | undefined {
  const value = Deno.env.get(name)?.trim();
  if (!value) return undefined;

  const port = Number(value);
  if (!Num.Is.int(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid ${name}: expected TCP port number, got '${value}'.`);
  }
  return port;
}
