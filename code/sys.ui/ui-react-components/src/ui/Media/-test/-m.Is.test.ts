import { beforeAll, afterAll, describe, DomMock, expect, it } from '../../../-test.ts';
import { Is } from '../mod.ts';

describe('Media.Is', () => {
  describe('Is.mediaStream', () => {
    it('true (instanceof branch, if MediaStream exists)', () => {
      const MediaStreamCtor = (globalThis as any).MediaStream as
        | (new () => MediaStream)
        | undefined;

      if (typeof MediaStreamCtor === 'function') {
        const stream = new MediaStreamCtor();
        expect(Is.mediaStream(stream)).to.be.true;
      } else {
        // If the runtime has no MediaStream, we still cover the duck branch below.
        expect(true).to.be.true;
      }
    });

    it('true (duck-typed branch)', () => {
      const stream = DomMock.Fake.Media.stream();
      expect(Is.mediaStream(stream)).to.be.true;
    });

    it('false', () => {
      const constraints: MediaStreamConstraints = { audio: true };
      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, [], constraints];
      NON.forEach((v: any) => expect(Is.mediaStream(v)).to.be.false);
    });
  });

  describe('Is.constraints', () => {
    it('true', () => {
      const a: MediaStreamConstraints = { audio: true };
      const b: MediaStreamConstraints = { video: true };
      const c: MediaStreamConstraints = { video: true, audio: true };
      expect(Is.constraints(a)).to.be.true;
      expect(Is.constraints(b)).to.be.true;
      expect(Is.constraints(c)).to.be.true;
    });

    it('false', () => {
      const stream = DomMock.Fake.Media.stream();

      const NON = [stream, '', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v: any) => expect(Is.constraints(v)).to.be.false);
    });
  });

  describe('Is.deviceInfo', () => {
    it('true (duck-typed MediaDeviceInfo)', () => {
      const dev = {
        deviceId: 'dev-1',
        kind: 'audioinput' as MediaDeviceKind,
        label: 'Mic',
        groupId: 'grp-1',
      } as MediaDeviceInfo;

      expect(Is.deviceInfo(dev)).to.be.true;
    });

    it('false (missing required fields or wrong shapes)', () => {
      const stream = DomMock.Fake.Media.stream();
      const constraints: MediaStreamConstraints = { audio: true };

      const NON = [
        '',
        123,
        true,
        null,
        undefined,
        BigInt(0),
        Symbol('foo'),
        {},
        [],
        constraints,
        stream,
        { deviceId: 'x' }, // missing kind
        { kind: 'audioinput' }, // missing deviceId
        { deviceId: 123, kind: 'audioinput' }, // wrong deviceId type
      ];

      NON.forEach((v: any) => expect(Is.deviceInfo(v)).to.be.false);
    });
  });

  describe('Is.track', () => {
    it('true (duck-typed MediaStreamTrack)', () => {
      const track = DomMock.Fake.Media.track({
        id: 't-1',
        kind: 'video',
        enabled: true,
        readyState: 'live',
        label: 'Cam',
        settings: { width: 1280, height: 720 } as MediaTrackSettings,
      });

      expect(Is.track(track)).to.be.true;
    });

    it('false (missing pieces)', () => {
      const stream = DomMock.Fake.Media.stream();

      const withNoSettings = {
        id: 'x',
        kind: 'audio',
        // getSettings missing → should be false
      } as unknown as MediaStreamTrack;

      const withWrongGetSettings = {
        id: 'x',
        kind: 'audio',
        getSettings: 123, // not a function
      } as unknown as MediaStreamTrack;

      const NON = [
        '',
        123,
        true,
        null,
        undefined,
        BigInt(0),
        Symbol('foo'),
        {},
        [],
        stream, // stream, not track
        { id: 'x' }, // missing kind + getSettings
        { kind: 'audio' }, // missing id + getSettings
        withNoSettings,
        withWrongGetSettings,
      ];

      NON.forEach((v: any) => expect(Is.track(v)).to.be.false);
    });
  });
});

describe('Media.Is (HappyDOM instanceof)', () => {
  DomMock.init({ beforeAll, afterAll });

  it('true (HappyDOM instanceof MediaStream)', () => {
    const stream = new (globalThis as any).MediaStream();
    expect(Is.mediaStream(stream)).to.be.true;
  });
});
