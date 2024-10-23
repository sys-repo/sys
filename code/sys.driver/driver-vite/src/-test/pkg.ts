import { default as deno } from '../../deno.json' with { type: 'json' };

type Pkg = { name: string; version: string}

const {name, version  } = deno;
export const Pkg : Pkg = { name, version }
export const pkg = Pkg;
