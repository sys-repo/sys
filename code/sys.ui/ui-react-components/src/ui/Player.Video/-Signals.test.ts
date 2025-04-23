import { type t, describe, expect, it } from '../../-test.ts';
import { Player } from '../Player/mod.ts';
import { D } from './common.ts';
import { playerSignalsFactory } from './mod.ts';

describe('VideoPlayer: Signals API', () => {
  describe('props', () => {
    it('initial values (defaults)', () => {
      const s = playerSignalsFactory();
      const p = s.props;

      expect(p.ready.value).to.eql(false);
      expect(p.src.value).to.eql(D.video);

      expect(p.playing.value).to.eql(false);
      expect(p.currentTime.value).to.eql(0);
      expect(p.loop.value).to.eql(D.loop);
      expect(p.autoPlay.value).to.eql(D.autoPlay);
      expect(p.muted.value).to.eql(D.muted);

      expect(p.showControls.value).to.eql(true);
      expect(p.showFullscreenButton.value).to.eql(D.showFullscreenButton);
      expect(p.showVolumeControl.value).to.eql(D.showVolumeControl);
      expect(p.cornerRadius.value).to.eql(D.cornerRadius);
      expect(p.aspectRatio.value).to.eql(D.aspectRatio);
      expect(p.background.value).to.eql(D.background);
      expect(p.scale.value).to.eql(D.scale);
      expect(p.fadeMask.value).to.eql(undefined);

      expect(p.jumpTo.value).to.eql(undefined);

      p.playing.value = true;
      expect(p.playing.value).to.eql(true);
    });

    describe('custom params', () => {
      it('defaults', () => {
        const scale: t.VideoPlayerScale = (e) => e.enlargeBy(1);
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
          scale,
          fadeMask: { direction: 'Top:Down', size: 123 },
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
        expect(p.scale.value).to.equal(scale);
        expect(p.fadeMask.value).to.eql({ direction: 'Top:Down', size: 123 });
      });

      it('param: src param (string)', () => {
        const s = Player.Video.signals('vimeo/foobar');
        expect(s.props.src.value).to.eql('vimeo/foobar');
      });

      it('param: fadeMask ← number - expands to { Top:Down, <number>: pixels} ', () => {
        const a = Player.Video.signals({});
        const b = Player.Video.signals({ fadeMask: 123 });
        const c = Player.Video.signals({ fadeMask: { direction: 'Bottom:Up' } });

        const maskA = a.props.fadeMask.value;
        const maskB = b.props.fadeMask.value!;
        const maskC = c.props.fadeMask.value!;

        type T = t.VideoPlayerFadeMask;
        const assert = (value: T, expected: T) => expect(value).to.eql(expected);

        expect(maskA).to.be.undefined;
        assert(maskB, { direction: 'Top:Down', size: 123 });
        assert(maskC, { direction: 'Bottom:Up' });
      });
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
