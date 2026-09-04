import { D, Files, Fs } from './common.ts';

const root = Fs.Path.fromFileUrl(new URL('./dist', import.meta.url));
const policy = Files.Policy.readonly('**');

/** Sample-owned config for the static Files publication server. */
export const SampleFiles = {
  name: D.name,
  port: D.port,
  root,
  policy,
  paths: {
    dist: D.dist,
    readme: 'docs/README.md',
  },
} as const;
