const taskMain = `deno run -RWNE --allow-run --allow-ffi ./-scripts/-main.ts`;

export const denofile = `
{
  "tasks": {
    "dev": "${taskMain} --cmd=dev",
    "build": "${taskMain} --cmd=build",
    "serve": "${taskMain} --cmd=serve"
  }
}
`.slice(1);
