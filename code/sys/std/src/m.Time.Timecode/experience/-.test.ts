import { describe, expect, it } from '../../-test.ts';

import type { t } from './common.ts';
import { Experience } from './mod.ts';

describe('timecode/experience', () => {
  type Payload = { label: string };

  describe('happy path', () => {
    it('toTimeline: maps beats and applies pause (single segment)', () => {
      const resolved: t.TimecodeCompositionResolved = {
        total: 1000,
        segments: [
          {
            src: 'video.mp4',
            original: { from: 0, to: 1000 },
            virtual: { from: 0, to: 1000 },
          },
        ],
      };

      const beats: readonly t.TimecodeExperienceBeat<Payload>[] = [
        {
          src: { ref: 'video.mp4', time: 200 },
          pause: 100,
          payload: { label: 'A' },
        },
        {
          src: { ref: 'video.mp4', time: 800 },
          payload: { label: 'B' },
        },
      ];

      const timeline = Experience.toTimeline(resolved, beats);
      expect(timeline.duration).to.eql(1100);
      expect(timeline.beats.length).to.eql(2);

      // First beat sits where we placed it.
      expect(timeline.beats[0].vTime).to.eql(200);

      // Second beat is shifted by the first beat's pause.
      expect(timeline.beats[1].vTime).to.eql(900);
    });

    it('toTimeline: beats on a sliced second segment map correctly and respect pauses', () => {
      const resolved: t.TimecodeCompositionResolved = {
        total: 2000,
        segments: [
          {
            // First segment: full file [0..1000) → [0..1000)
            src: 'video-1.mp4',
            original: { from: 0, to: 1000 },
            virtual: { from: 0, to: 1000 },
          },
          {
            // Second segment: think of this as a slice "01:00..02:00" of the source.
            // Note the non-zero original.from — this is what we care about exercising.
            src: 'video-2.mp4',
            original: { from: 1000, to: 2000 },
            virtual: { from: 1000, to: 2000 },
          },
        ],
      };

      const beats: readonly t.TimecodeExperienceBeat<Payload>[] = [
        {
          src: { ref: 'video-1.mp4', time: 250 },
          pause: 100,
          payload: { label: 'A' },
        },
        {
          // This timestamp lands inside the *sliced* window of the second segment.
          src: { ref: 'video-2.mp4', time: 1500 },
          payload: { label: 'B' },
        },
      ];

      const timeline = Experience.toTimeline(resolved, beats);
      expect(timeline.beats.length).to.eql(2);

      // Total duration = base virtual total + sum(pause).
      expect(timeline.duration).to.eql(2100);

      // First beat: direct mapping, no prior pauses.
      expect(timeline.beats[0].vTime).to.eql(250);

      // Second beat:
      // - Base virtual time: segment[1].virtual.from + (1500 - 1000) = 1000 + 500 = 1500
      // - Plus cumulative pause from beat[0]: 1500 + 100 = 1600
      expect(timeline.beats[1].vTime).to.eql(1600);

      // Payloads preserved.
      expect(timeline.beats[0].payload.label).to.eql('A');
      expect(timeline.beats[1].payload.label).to.eql('B');
    });
  });

  describe('pauses and duration', () => {
    it('toTimeline: no pauses yields base duration and direct mapping', () => {
      const resolved: t.TimecodeCompositionResolved = {
        total: 1000,
        segments: [
          {
            src: 'video.mp4',
            original: { from: 0, to: 1000 },
            virtual: { from: 0, to: 1000 },
          },
        ],
      };

      const beats: readonly t.TimecodeExperienceBeat<Payload>[] = [
        { src: { ref: 'video.mp4', time: 100 }, payload: { label: 'A' } },
        { src: { ref: 'video.mp4', time: 400 }, payload: { label: 'B' } },
        { src: { ref: 'video.mp4', time: 900 }, payload: { label: 'C' } },
      ];

      const timeline = Experience.toTimeline(resolved, beats);

      // Duration unchanged when no pauses are present.
      expect(timeline.duration).to.eql(1000);
      expect(timeline.beats.length).to.eql(3);

      // With a single segment [0..1000) → [0..1000), vTime mirrors source time.
      expect(timeline.beats[0].vTime).to.eql(100);
      expect(timeline.beats[1].vTime).to.eql(400);
      expect(timeline.beats[2].vTime).to.eql(900);
    });

    it('toTimeline: cumulative pauses shift later beats and extend duration', () => {
      const resolved: t.TimecodeCompositionResolved = {
        total: 1000,
        segments: [
          {
            src: 'video.mp4',
            original: { from: 0, to: 1000 },
            virtual: { from: 0, to: 1000 },
          },
        ],
      };

      const beats: readonly t.TimecodeExperienceBeat<Payload>[] = [
        {
          src: { ref: 'video.mp4', time: 100 },
          pause: 50,
          payload: { label: 'A' },
        },
        {
          src: { ref: 'video.mp4', time: 200 },
          pause: 70,
          payload: { label: 'B' },
        },
        {
          src: { ref: 'video.mp4', time: 300 },
          payload: { label: 'C' },
        },
      ];

      const timeline = Experience.toTimeline(resolved, beats);

      // Base duration (1000) + 50 + 70 = 1120.
      expect(timeline.duration).to.eql(1120);
      expect(timeline.beats.length).to.eql(3);

      // Cumulative pause behaviour:
      // - Beat 0: 100 + 0       = 100
      // - Beat 1: 200 + 50      = 250
      // - Beat 2: 300 + 50 + 70 = 420
      expect(timeline.beats[0].vTime).to.eql(100);
      expect(timeline.beats[1].vTime).to.eql(250);
      expect(timeline.beats[2].vTime).to.eql(420);
    });
  });
});
