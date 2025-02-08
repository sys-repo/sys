import { type t, describe, it, expect, Testing } from '../-test.ts';
import { Semver } from './mod.ts';
import { Fmt } from './m.Fmt.ts';
import { Base } from './common.ts';

describe('Sermver (server', () => {
  it('API', () => {
    expect(Semver.Fmt).to.equal(Fmt);
    Object.keys(Base).forEach((key) => {
      expect((Semver as any)[key]).to.equal((Base as any)[key]);
    });
  });
});
