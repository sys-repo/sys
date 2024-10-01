import { DenoCloud, Pkg } from '../src/u.cloud/server.ts';

/**
 * Start
 */
const port = 8080;
DenoCloud.serve({ Pkg, port });
