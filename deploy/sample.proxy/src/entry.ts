import { HttpProxy } from '@sys/http/server';
import { Routes } from './m.routes.ts';

export const proxy = HttpProxy.create({ config: Routes.proxy });

export function main() {
  return proxy;
}

if (import.meta.main) {
  Deno.serve(proxy.fetch);
}
