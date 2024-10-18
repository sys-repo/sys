import { DenoCloud, Pkg } from '@sys/driver-deno/cloud/server';

/**
 * Start
 */
DenoCloud.serve(8080, Pkg);
