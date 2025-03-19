import { Time, describe, expect, it, Signal } from '../../-test.ts';
import { DEFAULTS } from './common.ts';
import { signalsFactory } from './mod.ts';

describe('Landing (Screen): Signals API', () => {
  describe('props', () => {
    it('initial values (defaults)', async () => {
      const signals = signalsFactory();
      const p = signals.props;
      expect(p.ready.value).to.eql(false);
    });

    it('param: custom {defaults}', () => {
      const s = signalsFactory();
      const p = s.props;
      // expect(p.src.value).to.eql('vimeo/foobar');
    });
  });
});
