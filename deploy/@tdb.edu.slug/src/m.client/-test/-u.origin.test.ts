import { describe, expect, it } from '../../-test.ts';
import { parseOrigin } from '../u.origin.ts';

describe('parseOrigin', () => {
  it('normalizes a string origin into app + cdn surfaces', () => {
    const res = parseOrigin('http://localhost:4040/');
    expect(res).to.eql({
      app: 'http://localhost:4040',
      cdn: {
        default: 'http://localhost:4040',
        video: 'http://localhost:4040',
      },
    });
  });

  it('normalizes explicit origins', () => {
    const res = parseOrigin({
      app: 'http://app.local/',
      cdn: { default: 'http://cdn.local/', video: 'http://video.cdn.local/' },
    });
    expect(res).to.eql({
      app: 'http://app.local',
      cdn: {
        default: 'http://cdn.local',
        video: 'http://video.cdn.local',
      },
    });
  });

  it('falls back to app when cdn values are missing', () => {
    const res = parseOrigin({
      app: 'http://app.local',
      cdn: { default: '', video: '' },
    });
    expect(res).to.eql({
      app: 'http://app.local',
      cdn: {
        default: 'http://app.local',
        video: 'http://app.local',
      },
    });
  });
});
