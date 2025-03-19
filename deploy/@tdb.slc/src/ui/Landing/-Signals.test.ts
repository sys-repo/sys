import { Time, describe, expect, it, Signal } from '../../-test.ts';
import { DEFAULTS } from './common.ts';
import { signalsFactory } from './mod.ts';

describe('Landing (Screen): Signals API', () => {
  describe('props', () => {
    it('initial values (defaults)', () => {
      const signals = signalsFactory();
      const p = signals.props;
      expect(p.ready.value).to.eql(false);
      expect(p.canvasPosition.value === 'Center').to.be.true;
    });

    it('param: custom { defaults }', () => {
      const s = signalsFactory({
        canvasPosition: 'Center:Bottom',
      });
      const p = s.props;
      expect(p.canvasPosition.value === 'Center:Bottom').to.be.true;
    });
  });
});
