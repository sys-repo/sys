import { type t, describe, expect, it } from '../../-test.ts';
import { parseTime, findTimestamp } from './u.ts';

/**
 * TODO 🐷
 * rewrite to: @sys/std/Timestamp
 */
describe('Thumbnails', () => {
  describe('Thumbnail/Video timestamps', () => {
    it('has image', () => {
      const timestamps: t.VideoTimestamps = {
        '00:00:00.000': {},
        '00:00:10.000': { image: '/path/to-image.png' },
      };
    });
  });
});
