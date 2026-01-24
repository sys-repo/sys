import { type t, describe, expect, it } from '../../../-test.ts';
import { Player } from '../../Player/mod.ts';
import { D } from '../common.ts';
import { VideoSignals } from '../mod.ts';

describe('VideoPlayer: Signals API', () => {
  describe('props', () => {
    it('initial values (defaults)', () => {
      const s = VideoSignals.create();
      const p = s.props;

      expect(s.instance.length).to.be.greaterThan(4);
      expect(p.ready.value).to.eql(false);
      expect(p.src.value).to.eql(undefined);
      expect(s.src).to.eql(p.src.value);

      expect(p.playing.value).to.eql(false);
      expect(p.currentTime.value).to.eql(0);
      expect(p.duration.value).to.eql(0);
      expect(p.loop.value).to.eql(D.loop);
      expect(p.autoPlay.value).to.eql(D.autoPlay);
      expect(p.muted.value).to.eql(D.muted);

      expect(p.showControls.value).to.eql(true);
      expect(p.showFullscreenButton.value).to.eql(D.showFullscreenButton);
      expect(p.showVolumeControl.value).to.eql(D.showVolumeControl);
      expect(p.cornerRadius.value).to.eql(D.cornerRadius);
      expect(p.aspectRatio.value).to.eql(D.aspectRatio);
      expect(p.scale.value).to.eql(D.scale);
      expect(p.fadeMask.value).to.eql(undefined);

      expect(p.buffering.value).to.eql(false);
      expect(p.buffered.value).to.eql(undefined);
      expect(p.slice.value).to.eql(undefined);

      expect(p.endedTick.value).to.eql(0);
      expect(p.jumpTo.value).to.eql(undefined);

      // Signals are writable.
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
          slice: '00:15:20..-00:00:05',
          fadeMask: { direction: 'Top:Down', size: 123 },
          scale,
        });

        const p = s.props;
        expect(p.src.value).to.eql('vimeo/foobar');
        expect(p.loop.value).to.eql(true);
        expect(p.aspectRatio.value).to.eql('2.39/1');
        expect(p.autoPlay.value).to.eql(true);
        expect(p.muted.value).to.eql(true);
        expect(p.slice.value).to.eql('00:15:20..-00:00:05');

        expect(p.showControls.value).to.eql(false);
        expect(p.showFullscreenButton.value).to.eql(true);
        expect(p.showVolumeControl.value).to.eql(false);
        expect(p.cornerRadius.value).to.eql(0);
        expect(p.scale.value).to.eql(scale);
        expect(p.fadeMask.value).to.eql({ direction: 'Top:Down', size: 123 });
        expect(p.endedTick.value).to.eql(0);
      });

      it('param: src param (string)', () => {
        const s = Player.Video.signals('vimeo/foobar');
        expect(s.props.src.value).to.eql('vimeo/foobar');
      });

      it('param: fadeMask ← number expands to { Top:Down, <number>: pixels }', () => {
        const a = Player.Video.signals({});
        const b = Player.Video.signals({ fadeMask: 123 });
        const c = Player.Video.signals({ fadeMask: { direction: 'Bottom:Up' } });

        const maskA = a.props.fadeMask.value;
        const maskB = b.props.fadeMask.value!;
        const maskC = c.props.fadeMask.value!;

        type TMask = t.VideoPlayerFadeMask;
        const assert = (value: TMask, expected: TMask) => expect(value).to.eql(expected);

        expect(maskA).to.be.undefined;
        assert(maskB, { direction: 'Top:Down', size: 123 });
        assert(maskC, { direction: 'Bottom:Up' });
      });
    });
  });

  describe('methods', () => {
    it('play / pause / toggle affect only playing', () => {
      const s = VideoSignals.create();
      expect(s.props.playing.value).to.eql(false);

      s.play();
      expect(s.props.playing.value).to.eql(true);

      s.pause();
      expect(s.props.playing.value).to.eql(false);

      s.toggle();
      expect(s.props.playing.value).to.eql(true);

      s.toggle(false);
      expect(s.props.playing.value).to.eql(false);

      s.toggle(true);
      expect(s.props.playing.value).to.eql(true);
    });

    describe('jumpTo() → intent only (no side effects)', () => {
      it('jumpTo emits intent without changing play state', () => {
        const s = VideoSignals.create();

        s.play();
        expect(s.props.playing.value).to.eql(true);

        s.jumpTo(10);
        expect(s.props.jumpTo.value).to.eql({ second: 10, play: undefined });
        expect(s.props.playing.value).to.eql(true);
      });

      it('jumpTo with play=false emits pause intent only', () => {
        const s = VideoSignals.create();

        s.play();
        expect(s.props.playing.value).to.eql(true);

        s.jumpTo(15, { play: false });
        expect(s.props.jumpTo.value).to.eql({ second: 15, play: false });
        expect(s.props.playing.value).to.eql(true); // unchanged
      });

      it('jumpTo with play=true emits play intent only', () => {
        const s = VideoSignals.create();

        s.pause();
        expect(s.props.playing.value).to.eql(false);

        s.jumpTo(20, { play: true });
        expect(s.props.jumpTo.value).to.eql({ second: 20, play: true });
        expect(s.props.playing.value).to.eql(false); // unchanged
      });
    });
  });
});
