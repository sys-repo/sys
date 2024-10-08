import './u.env-patch.ts';
import { DenoCloud } from 'jsr:@sys/driver-deno/cloud/server';

DenoCloud.serve(8080);
