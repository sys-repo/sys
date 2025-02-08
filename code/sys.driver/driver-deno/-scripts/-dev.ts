import { DenoCloud, pkg } from '@sys/driver-deno/cloud/server';

/**
 * Start
 */
console.info();
DenoCloud.serve(8080, pkg);
