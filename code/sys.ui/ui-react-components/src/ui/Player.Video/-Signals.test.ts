import { describe, expect, it } from '../../-test.ts';
import { Player } from '../Player/mod.ts';
import { DEFAULTS } from './common.ts';
import { playerSignalsFactory } from './mod.ts';

describe('VideoPlayer: Signals API', () => {
  describe('props', () => {
    it('initial values (defaults)', () => {
      const s = playerSignalsFactory();
      const p = s.props;

      expect(p.ready.value).to.eql(false);
      expect(p.src.value).to.eql(DEFAULTS.video);

      expect(p.playing.value).to.eql(false);
      expect(p.currentTime.value).to.eql(0);
      expect(p.loop.value).to.eql(DEFAULTS.loop);
      expect(p.autoPlay.value).to.eql(DEFAULTS.autoPlay);
      expect(p.muted.value).to.eql(DEFAULTS.muted);

      expect(p.showControls.value).to.eql(true);
      expect(p.showFullscreenButton.value).to.eql(DEFAULTS.showFullscreenButton);
      expect(p.showVolumeControl.value).to.eql(DEFAULTS.showVolumeControl);
      expect(p.cornerRadius.value).to.eql(DEFAULTS.cornerRadius);
      expect(p.aspectRatio.value).to.eql(DEFAULTS.aspectRatio);
      expect(p.background.value).to.eql(DEFAULTS.background);

      expect(p.jumpTo.value).to.eql(undefined);

      p.playing.value = true;
      expect(p.playing.value).to.eql(true);
    });

    it('param: custom { defaults }', () => {
      const s = Player.Video.signals({
        src: 'vimeo/foobar',
        loop: true,
        showControls: false,
        showFullscreenButton: true,
        showVolumeControl: false,
        cornerRadius: 0,
        aspectRatio: '2.39/1',
        autoPlay: true,
        muted: true,
        background: true,
      });

      const p = s.props;
      expect(p.src.value).to.eql('vimeo/foobar');
      expect(p.loop.value).to.eql(true);
      expect(p.aspectRatio.value).to.eql('2.39/1');
      expect(p.autoPlay.value).to.eql(true);
      expect(p.muted.value).to.eql(true);

      expect(p.showControls.value).to.eql(false);
      expect(p.showFullscreenButton.value).to.eql(true);
      expect(p.showVolumeControl.value).to.eql(false);
      expect(p.cornerRadius.value).to.eql(0);
      expect(p.background.value).to.eql(true);
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
