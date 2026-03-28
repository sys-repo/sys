import { Jsr } from '@sys/registry/jsr/client';
const m = await Jsr.Fetch.Pkg.versions('@sys/driver-vite');
console.log(m);
