import { type t, expect } from '../../-test.ts';
import { Obj } from '../common.ts';

export function expectDiagAt(
  diags: t.Ary<{ path?: t.ObjectPath }>,
  base: t.ObjectPath,
  rel: t.ObjectPath,
) {
  const abs = Obj.Path.join(base as (string | number)[], rel as (string | number)[]);
  const hit = diags.find((d) => Array.isArray(d.path) && Obj.Path.eql(d.path!, abs));
  expect(!!hit).to.eql(true);
  return hit;
}
