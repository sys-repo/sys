import { type t, describe, it, expect, Testing } from '../../-test.ts';
import { Jsr } from './mod.ts';

import { Jsr as Client } from '../../ns.client/m.Jsr/mod.ts';
import { Manifest } from '../mod.ts';

describe('Jsr (server)', () => {
  it('API', () => {
    expect(Jsr.Fetch).to.equal(Client.Fetch);
    expect(Jsr.Manifest).to.equal(Manifest);
  });
});
