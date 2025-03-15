import { describe, expect, it } from '../../-test.ts';
import { Player } from '../Player/mod.ts';
import { playerSignalsFactory } from './mod.ts';
import { DEFAULTS } from './common.ts';

describe('VideoPlayer', () => {
  describe('props', () => {
    it('initial values (defaults)', () => {
      const s = playerSignalsFactory();
      const p = s.props;

      expect(p.ready.value).to.eql(false);
      expect(p.playing.value).to.eql(false);
      expect(p.loop.value).to.eql(DEFAULTS.loop);
      expect(p.currentTime.value).to.eql(0);
      expect(p.jumpTo.value).to.eql(undefined);
      expect(p.fullscreenButton.value).to.eql(DEFAULTS.fullscreenButton);

      p.playing.value = true;
      expect(p.playing.value).to.eql(true);
    });

    it('param: custom {defaults}', () => {
      const s = Player.Video.signals({
        fullscreenButton: true,
        loop: true,
      });

      const p = s.props;
      expect(p.fullscreenButton.value).to.eql(true);
      expect(p.loop.value).to.eql(true);
    });
  });

  describe('methods', () => {
    it('jumpTo() method → props.jumpTo', () => {
      const s = playerSignalsFactory();
      expect(s.props.jumpTo.value).to.eql(undefined);

      s.jumpTo(10);
      expect(s.props.jumpTo.value).to.eql({ second: 10, play: true });

      s.jumpTo(15, { play: false });
      expect(s.props.jumpTo.value).to.eql({ second: 15, play: false });
    });
  });
});
