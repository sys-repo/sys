import { proxy } from './mod.ts';

Deno.serve(proxy.fetch);
