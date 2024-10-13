import './u.env-patch.ts';
import { DenoCloud } from '@sys/driver-deno/cloud/server';
import { default as pkg } from './deno.json' with { type: 'json' };

DenoCloud.serve(8080, pkg);
