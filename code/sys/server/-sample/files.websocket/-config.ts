import { D, Files, Fs, type t } from './common.ts';

const root = Fs.Path.fromFileUrl(new URL('./docs', import.meta.url));
const policy = Files.Policy.readonly('**', { watch: '**' });
const details = [
  { label: 'sample', value: 'files:ws' },
  { label: 'backing', value: 'files/fs:live' },
] satisfies readonly t.Service.Detail[];

/** Principle config for the Files WebSocket sample. */
export const SampleFiles = {
  name: D.name,
  port: D.port,
  path: D.path,
  root,
  policy,
  details,
} as const;
