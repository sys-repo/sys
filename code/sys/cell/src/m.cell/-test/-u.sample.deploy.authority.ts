import { Json, Obj } from '../common.ts';
import { DeploySampleProof } from './u.sample.deploy.proof.ts';

const state = async (descriptor: Deno.PermissionDescriptor) =>
  (await Deno.permissions.query(descriptor)).state;
const permissions = {
  env: await state({ name: 'env' }),
  home: await state({ name: 'env', variable: 'HOME' }),
  net: await state({ name: 'net' }),
  run: await state({ name: 'run' }),
  sys: await state({ name: 'sys' }),
  ffi: await state({ name: 'ffi' }),
};
const expected = {
  env: 'denied',
  home: 'denied',
  net: 'denied',
  run: 'denied',
  sys: 'denied',
  ffi: 'denied',
};

if (!Obj.eql(permissions, expected)) {
  throw new Error(
    `Cell Deploy authority proof received unexpected permissions.\n${Json.stringify(permissions)}`,
  );
}
DeploySampleProof.assert(await DeploySampleProof.run());
console.info('Cell provider-neutral Deploy sample authority proof passed.');
