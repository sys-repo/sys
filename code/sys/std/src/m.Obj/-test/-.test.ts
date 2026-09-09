import { describe, expect, it } from '../../-test.ts';
import { Lens } from '../../m.Obj.Lens/mod.ts';
import { Path } from '../../m.Obj.Path/mod.ts';
import { Obj } from '../mod.ts';

describe('Obj', () => {
  it('API', async () => {
    const ObjModule = await import('@sys/std/obj');
    const ObjPath = await import('@sys/std/obj/path');
    expect(ObjModule.Obj).to.equal(Obj);
    expect(ObjPath.Path).to.equal(Path);
    expect(Obj.Lens).to.equal(Lens);
    expect(Obj.Path).to.equal(Path);
  });
});
