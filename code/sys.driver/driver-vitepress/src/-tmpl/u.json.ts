const taskMain = `deno run -RWNE --allow-run --allow-ffi ./.scripts/-main.ts`;
const deno = `
{
  "tasks": {
    "dev": "${taskMain} --cmd=dev",
    "build": "${taskMain} --cmd=build",
    "serve": "${taskMain} --cmd=serve"
  }
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
