import { pkg } from '../pkg.ts';
import type { t } from './common.ts';

export const denofile = (args: { pkg?: t.Pkg } = {}) => {
  const self = args.pkg ?? pkg;

  // import: → "@sys/driver-vitepress"
  const importUri = `jsr:${self.name}@${self.version}`;
  const entry = `${importUri}/main`;
  const json = `
{
  "version": "0.0.0",
  "tasks": {
    "dev":     "deno run -RWNE --allow-run ${entry} --cmd=dev",
    "build":   "deno run -RWNE --allow-run ${entry} --cmd=build",
    "serve":   "deno run -RNE --allow-run ${entry} --cmd=serve",
    "upgrade": "deno run -RWNE --allow-run ${entry} --cmd=upgrade"
    "help": "deno run -RWNE --allow-run ${entry} --cmd=help"
  },
  "nodeModulesDir": "auto",
  "imports": {
    "${self.name}": "${importUri}"
  }
}
`.slice(1);

  return json;
};
