import { describe, expect, it } from '../../-test.ts';
import { EffectController } from '../mod.ts';

describe('EffectController.Causal.mirrorToken', () => {
  it('consumes matching value once', () => {
    const token = EffectController.Causal.mirrorToken<string | undefined>();
    token.mark('a');

    expect(token.consume('a')).to.eql(true);
    expect(token.consume('a')).to.eql(false);
  });

  it('supports undefined as a valid mirrored value', () => {
    const token = EffectController.Causal.mirrorToken<string | undefined>();
    token.mark(undefined);

    expect(token.consume(undefined)).to.eql(true);
    expect(token.consume(undefined)).to.eql(false);
  });

  it('does not consume non-matching values', () => {
    const token = EffectController.Causal.mirrorToken<number>();
    token.mark(1);

    expect(token.consume(2)).to.eql(false);
    expect(token.consume(1)).to.eql(true);
  });
});
