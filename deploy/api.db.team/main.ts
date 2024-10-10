import './u.env-patch.ts';
import { DenoCloud } from 'jsr:@sys/driver-deno@0.0.6/cloud/server';
import { default as pkg } from './deno.json' with { type: 'json' };

DenoCloud.serve(8080, pkg);
