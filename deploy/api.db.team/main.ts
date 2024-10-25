import { DenoCloud } from 'jsr:@sys/driver-deno/cloud/server';
import { pkg } from './pkg.ts';

/**
 * https://api.db.team
 */
DenoCloud.serve(8080, pkg);
