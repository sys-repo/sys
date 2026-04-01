import { HttpProxy } from '@sys/http/server';
import { Routes } from './m.routes.ts';

export function main(_ctx: { readonly targetDir: string }) {
  return HttpProxy.create({ config: Routes.proxy });
}

if (import.meta.main) {
  const app = main({ targetDir: './' });
  Deno.serve(app.fetch);
}
