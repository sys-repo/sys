import { DenoCloud, Pkg } from '../src/mod.cloud/server.ts';

/**
 * Start
 */
const port = 8080;
DenoCloud.serve({ Pkg, port });
