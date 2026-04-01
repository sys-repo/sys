import { DenoEntry } from '@sys/driver-deno/t';
import { HttpProxy } from '@sys/http/server';
import { Routes } from './m.routes.ts';

export const main: DenoEntry.Main = () => HttpProxy.create({ config: Routes.proxy });

if (import.meta.main) {
  Deno.serve(main().fetch);
}
