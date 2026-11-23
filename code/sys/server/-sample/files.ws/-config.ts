import { D, Files, Fs, Net } from './common.ts';

const root = Fs.Path.fromFileUrl(new URL('./docs', import.meta.url));
const policy = Files.Policy.readonly('**', { watch: '**' });

const value = Deno.env.get(D.env.port)?.trim();
const port = value ? Number(value) : D.port;
if (port !== 0 && !Net.Port.isFixed(port)) {
  throw new Error(`Invalid ${D.env.port}: expected TCP port in 0..65535, got '${value}'.`);
}

/** Sample-owned config for the Files WebSocket server. */
export const SampleFiles = {
  name: D.name,
  port,
  path: D.path,
  root,
  policy,
} as const;
