import { DenoCloud, Pkg } from '../src/m.Cloud/server.ts';

/**
 * Start
 */
const port = 8080;
DenoCloud.serve({ Pkg, port });
