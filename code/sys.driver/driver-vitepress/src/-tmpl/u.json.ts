const runScript = `deno run -RWNE --allow-run --allow-ffi ./.scripts`;
const taskMain = `${runScript}/-main.ts`;
const deno = `
{
  "version": "0.0.0",
  "tasks": {
    "dev": "${taskMain} --cmd=dev",
    "build": "${taskMain} --cmd=build",
    "serve": "${taskMain} --cmd=serve",
    "upgrade": "${runScript}/-upgrade.ts"
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

export const VSCode = { settings };
export const Pkg = { deno, package: pkg };
