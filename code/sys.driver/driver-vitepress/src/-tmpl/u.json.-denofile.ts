import { pkg } from '../pkg.ts';
import type { t } from './common.ts';

export const denofile = (args: { pkg?: t.Pkg } = {}) => {
  const self = args.pkg ?? pkg;
  const importUri = `jsr:@sys/driver-vitepress@${self.version}`;

  const entry = `jsr:@sys/driver-vitepress/main`;
  const json = `
{
  "version": "0.0.0",
  "tasks": {
    "dev":     "deno run -RWNE --allow-run ${entry} --cmd=dev",
    "build":   "deno run -RWNE --allow-run ${entry} --cmd=build",
    "serve":   "deno run -RNE ${entry} --cmd=serve",
    "upgrade": "deno run -RWNE ${entry} --cmd=upgrade"
  },
  "nodeModulesDir": "auto",
  "imports": {
    "${self.name}": "${importUri}"
  }
}
`.slice(1);

  return json;
};
