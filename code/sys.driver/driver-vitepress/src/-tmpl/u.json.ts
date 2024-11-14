const entry = `jsr:@sys/driver-vitepress/main`;
const deno = `
{
  "version": "0.0.0",
  "tasks": {
    "dev":     "deno run -RWNE --allow-run ${entry} --cmd=dev",
    "build":   "deno run -RWNE --allow-run ${entry} --cmd=build",
    "serve":   "deno run -RNE ${entry} --cmd=serve",
    "upgrade": "deno run -RWNE ${entry} --cmd=upgrade"
  },
  "nodeModulesDir": "auto"
}
`.slice(1);

const pkg = `
{
  "dependencies": {
    "vue": "3"
  }
}
`.slice(1);

const settings = `
{
  "deno.enable": true,
}
`.slice(1);

export const VSCode = { settings } as const;
export const Pkg = { deno, package: pkg } as const;
