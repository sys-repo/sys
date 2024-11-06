import { DenoCloud, pkg } from '@sys/driver-deno/cloud/server';

/**
 * Start
 */
DenoCloud.serve(8080, pkg);
