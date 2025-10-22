import { describe, DomMock, expect, it } from '../../../-test.ts';
import { Is } from '../mod.ts';

describe('Media.Is', () => {
  DomMock.polyfill();

  describe('Is.mediaStream', () => {
    it('true', () => {
      const stream = new MediaStream();
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
      const stream = new MediaStream();
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
      const stream = new MediaStream();
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
      // minimal duck-typed track: requires id + kind + getSettings()
      const track = {
        id: 't-1',
        kind: 'video',
        enabled: true,
        readyState: 'live',
        label: 'Cam',
        getSettings: () => ({ width: 1280, height: 720 }) as MediaTrackSettings,
        // required but unused members — stubbed:
        applyConstraints: async () => undefined,
        clone: () => undefined as unknown as MediaStreamTrack,
        getCapabilities: () => ({}) as MediaTrackCapabilities,
        getConstraints: () => ({}) as MediaTrackConstraints,
        onended: null,
        onmute: null,
        onunmute: null,
        contentHint: '',
        muted: false,
        stop: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => true,
      } as unknown as MediaStreamTrack;

      expect(Is.track(track)).to.be.true;
    });

    it('false (missing pieces)', () => {
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
        new MediaStream(), // stream, not track
        { id: 'x' }, // missing kind + getSettings
        { kind: 'audio' }, // missing id + getSettings
        withNoSettings,
        withWrongGetSettings,
      ];

      NON.forEach((v: any) => expect(Is.track(v)).to.be.false);
    });
  });
});
