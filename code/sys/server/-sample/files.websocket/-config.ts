import { D, Files, Fs } from './common.ts';

const root = Fs.Path.fromFileUrl(new URL('./docs', import.meta.url));
const policy = Files.Policy.readonly('**', { watch: '**' });

/** Principle config for the Files WebSocket sample. */
export const SampleFiles = {
  name: D.name,
  port: D.port,
  path: D.path,
  root,
  policy,
} as const;
