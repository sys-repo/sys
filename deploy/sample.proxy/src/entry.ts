import { DenoEntry } from '@sys/driver-deno/t';
import { HttpProxy } from '@sys/http/server';
import { Routes } from './m.routes.ts';

const createProxy = () => HttpProxy.create({ config: Routes.proxy });

export const main: DenoEntry.Main = (_ctx) => createProxy();

if (import.meta.main) {
  Deno.serve(createProxy().fetch);
}
