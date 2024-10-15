import { DenoCloud } from 'jsr:@sys/driver-deno/cloud/server';
import { default as pkg } from './deno.json' with { type: 'json' };

DenoCloud.serve(8080, pkg);
