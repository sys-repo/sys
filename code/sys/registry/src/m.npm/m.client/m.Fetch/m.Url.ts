import type { t } from './common.ts';

const REGISTRY = 'https://registry.npmjs.org';

export const Url: t.NpmUrlLib = {
  Pkg: {
    metadata(name) {
      return `${REGISTRY}/${encodeName(name)}`;
    },
    version(name, version) {
      return `${REGISTRY}/${encodeName(name)}/${version}`;
    },
  },
};

function encodeName(name: string): string {
  return String(name).replace('/', '%2F');
}
