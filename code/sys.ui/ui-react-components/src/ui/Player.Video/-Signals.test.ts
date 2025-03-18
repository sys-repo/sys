import { describe, expect, it } from '../../-test.ts';
import { Player } from '../Player/mod.ts';
import { DEFAULTS } from './common.ts';
import { playerSignalsFactory } from './mod.ts';

describe('VideoPlayer: Signals', () => {
  describe('props', () => {
    it('initial values (defaults)', () => {
      const s = playerSignalsFactory();
      const p = s.props;

      expect(p.ready.value).to.eql(false);
      expect(p.playing.value).to.eql(false);
      expect(p.loop.value).to.eql(DEFAULTS.loop);
      expect(p.currentTime.value).to.eql(0);
      expect(p.jumpTo.value).to.eql(undefined);
      expect(p.showControls.value).to.eql(true);
      expect(p.showFullscreenButton.value).to.eql(DEFAULTS.showFullscreenButton);

      p.playing.value = true;
      expect(p.playing.value).to.eql(true);
    });

    it('param: custom {defaults}', () => {
      const s = Player.Video.signals({
        showControls: false,
        showFullscreenButton: true,
        loop: true,
      });

      const p = s.props;
      expect(p.loop.value).to.eql(true);
      expect(p.showControls.value).to.eql(false);
      expect(p.showFullscreenButton.value).to.eql(true);
    });
  });

  describe('methods', () => {
    it('jumpTo() method → props.jumpTo', () => {
      const s = playerSignalsFactory();
      expect(s.props.jumpTo.value).to.eql(undefined);

      const res = s.jumpTo(10);
      expect(res).to.equal(s);
      expect(s.props.jumpTo.value).to.eql({ second: 10, play: true });

      s.jumpTo(15, { play: false });
      expect(s.props.jumpTo.value).to.eql({ second: 15, play: false });
    });

    it('play', () => {
      const s = playerSignalsFactory();
      const assertPlaying = (value: boolean) => expect(s.props.playing.value).to.eql(value);
      assertPlaying(false);

      const res = s.play();
      expect(res).to.equal(s);
      assertPlaying(true);
    });

    it('pause', () => {
      const s = playerSignalsFactory();
      const assertPlaying = (value: boolean) => expect(s.props.playing.value).to.eql(value);
      assertPlaying(false);

      s.play();
      assertPlaying(true);

      const res = s.play().pause();
      expect(res).to.equal(s);
      assertPlaying(false);
    });

    it('toggle', () => {
      const s = playerSignalsFactory();
      const assertPlaying = (value: boolean) => expect(s.props.playing.value).to.eql(value);
      assertPlaying(false);

      const res = s.toggle();
      expect(res).to.equal(s);
      assertPlaying(true);

      s.toggle();
      assertPlaying(false);
      s.toggle(false);
      assertPlaying(false);
      s.toggle(true);
      assertPlaying(true);
    });
  });
});
