import { describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';
import { Files } from '../../mod.ts';
import { Client } from '../mod.ts';

describe('Files.Client: API', () => {
  it('exports the public client adapter surface', () => {
    expect(Files.Client).to.equal(Client);
    expect(Object.keys(Client).sort()).to.eql(['local', 'transport', 'websocket']);

    expectTypeOf(Client).toEqualTypeOf<t.Files.Client.Lib>();
    expectTypeOf(Client.local).toEqualTypeOf<t.Files.Client.Lib['local']>();
    expectTypeOf(Client.transport).toEqualTypeOf<t.Files.Client.Lib['transport']>();
    expectTypeOf(Client.websocket).toEqualTypeOf<t.Files.Client.Lib['websocket']>();
  });
});
