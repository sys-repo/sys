import { DenoCloud, Pkg } from './cloud/server.ts';

/**
 * Start
 */
DenoCloud.serve({ port: 8080, Pkg });
