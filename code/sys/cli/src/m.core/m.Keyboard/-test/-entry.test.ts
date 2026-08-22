import { Keyboard as PublicKeyboard } from '@sys/cli/keyboard';
import { describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';
import { Cli } from '../../m.Cli/mod.ts';
import { Keyboard as InternalKeyboard } from '../mod.ts';

describe('@sys/cli/keyboard public entrypoint', () => {
  it('preserves one exact canonical frozen keyboard namespace', () => {
    expect(PublicKeyboard).to.equal(InternalKeyboard);
    expect(PublicKeyboard).to.equal(Cli.Keyboard);
    expect(Reflect.ownKeys(PublicKeyboard)).to.eql([
      'keypress',
      'Is',
      'bind',
      'shutdown',
    ]);
    expect(Object.isFrozen(PublicKeyboard)).to.eql(true);
    expect(Object.isFrozen(PublicKeyboard.Is)).to.eql(true);

    expect(PublicKeyboard.keypress).to.equal(InternalKeyboard.keypress);
    expect(PublicKeyboard.Is).to.equal(InternalKeyboard.Is);
    expect(PublicKeyboard.bind).to.equal(InternalKeyboard.bind);
    expect(PublicKeyboard.shutdown).to.equal(InternalKeyboard.shutdown);

    expectTypeOf(PublicKeyboard).toEqualTypeOf<t.CliKeyboard.Lib>();
  });
});
