import { type t, expect, describe, it } from '../../-test.ts';
import { Timestamp } from './mod.ts';

/**
 * TODO 🐷
 * rewrite to: @sys/std/Timestamp
 */
describe('Thumbnails', () => {
  describe('Video Timestamps', () => {
    it('has image', () => {
      const timestamps: t.VideoTimestamps = {
        '00:00:00.000': {},
        '00:00:10.000': { image: '/path/to-image.png' },
      };

      const a = Timestamp.find(timestamps, 1);
      const b = Timestamp.find(timestamps, 12);

      expect(a?.image).to.eql(undefined);
      expect(b?.image).to.eql('/path/to-image.png');
    });
  });
});
