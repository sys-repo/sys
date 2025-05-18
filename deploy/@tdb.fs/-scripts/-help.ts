import { pkg, Pkg } from './common.ts';

const { dist } = await Pkg.Dist.load('dist');

console.info();
console.info(Pkg.Dist.toString(dist));
console.info();
