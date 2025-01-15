import { Path, Pkg } from '../src/ns.server/common.ts';

const dir = Path.resolve('./src/-test/-sample.dist');
const m = await Pkg.Dist.compute({ dir });

const json = JSON.stringify(m.dist);
console.log('json', json);
