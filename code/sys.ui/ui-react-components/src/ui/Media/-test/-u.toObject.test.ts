import { type t, describe, DomMock, expect, expectTypeOf, it } from '../../../-test.ts';
import { Media } from '../mod.ts';

describe('Media.toObject', () => {
  DomMock.polyfill();
  const long = (n: number) => 'x'.repeat(n);

  it('device: routed (Media.toObject) → DeviceObject', () => {
    const device: MediaDeviceInfo = {
      deviceId: 'dev-1',
      kind: 'audioinput',
      label: long(64), // will be trimmed
      groupId: 'grp-1',
    } as MediaDeviceInfo;

    const obj = Media.toObject(device);
    expect(obj).to.be.ok;
    expect(obj?.deviceId).to.equal('dev-1');
    expect(obj?.kind).to.equal('audioinput');
    expect(obj?.groupId).to.equal('grp-1');
    expect(obj?.label?.length).to.be.lessThanOrEqual(33); // 32 + ellipsis

    // type check (use cast so matcher sees union on both sides)
    expectTypeOf(obj as t.DeviceObject | undefined).toEqualTypeOf<t.DeviceObject | undefined>();

    // direct helper parity
    const obj2 = Media.ToObject.device(device);
    expect(obj2).to.eql(obj);
  });

  it('device: undefined input → undefined', () => {
    const obj = Media.toObject(undefined);
    expect(obj).to.equal(undefined);
  });

  it('track: routed (Media.toObject) → TrackObject (with compact settings)', () => {
    // Duck-typed track (guard requires: id, kind, getSettings):
    const fakeTrack: MediaStreamTrack = {
      id: 'track-1',
      kind: 'video',
      enabled: true,
      readyState: 'live',
      label: long(80),
      getSettings: () =>
        ({
          deviceId: 'dev-cam',
          width: 1920,
          height: 1080,
          frameRate: 30,
          aspectRatio: 16 / 9,
          facingMode: 'user',
        }) as MediaTrackSettings,
      // Stubs to satisfy the interface (not used by the unit):
      applyConstraints: async () => undefined,
      clone: () => fakeTrack,
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

    const obj = Media.toObject(fakeTrack);
    expect(obj).to.be.ok;
    expect(obj?.id).to.equal('track-1');
    expect(obj?.kind).to.equal('video');
    expect(obj?.enabled).to.equal(true);
    expect(obj?.readyState).to.equal('live');
    expect(obj?.label?.length).to.be.lessThanOrEqual(33);
    expect(obj?.settings).to.eql({
      deviceId: 'dev-cam',
      width: 1920,
      height: 1080,
      frameRate: 30,
      aspectRatio: 16 / 9,
      facingMode: 'user',
    });

    expectTypeOf(obj as t.TrackObject | undefined).toEqualTypeOf<t.TrackObject | undefined>();

    // Direct helper parity:
    const obj2 = Media.ToObject.track(fakeTrack);
    expect(obj2).to.eql(obj);
  });

  it('track: settings omitted when empty', () => {
    const bareTrack: MediaStreamTrack = {
      id: 't0',
      kind: 'audio',
      enabled: false,
      readyState: 'ended',
      label: '',
      getSettings: () => ({}) as MediaTrackSettings,
      // Stubs:
      applyConstraints: async () => undefined,
      clone: () => bareTrack,
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

    const obj = Media.toObject(bareTrack);
    expect(obj?.settings).to.equal(undefined);
  });

  it('stream: routed (Media.toObject) → StreamObject', () => {
    // Real stream from DOM mock. Tracks not required for routing.
    const stream = new MediaStream();

    const obj = Media.toObject(stream);
    expect(obj).to.be.ok;
    expect(obj?.id).to.be.a('string');
    expect(obj?.active).to.be.a('boolean');
    expect(obj?.audio.count).to.equal(0);
    expect(obj?.video.count).to.equal(0);
    expect(obj?.audio.tracks).to.eql([]);
    expect(obj?.video.tracks).to.eql([]);

    expectTypeOf(obj as t.StreamObject | undefined).toEqualTypeOf<t.StreamObject | undefined>();

    // Direct helper parity:
    const obj2 = Media.ToObject.stream(stream);
    expect(obj2).to.eql(obj);
  });

  it('routing: unknown object → undefined (no throw)', () => {
    const obj = Media.toObject({ foo: 1 } as unknown as MediaDeviceInfo);
    expect(obj).to.equal(undefined);
  });

  it('options: maxLabel clamps length', () => {
    const device: MediaDeviceInfo = {
      deviceId: 'd2',
      kind: 'audioinput',
      label: 'abcdefghijklmnop', // 16
      groupId: 'g2',
    } as MediaDeviceInfo;

    const a = Media.toObject(device, { maxLabel: 8 }); // expect 8 + ellipsis
    expect(a?.label).to.equal('abcdefgh…');

    const b = Media.toObject(device, { maxLabel: 100 });
    expect(b?.label).to.equal('abcdefghijklmnop');
  });

  it('type overloads: return types align with inputs', () => {
    const stream = new MediaStream();
    const d = Media.toObject({
      deviceId: 'd',
      kind: 'audioinput',
      label: '',
      groupId: '',
    } as MediaDeviceInfo);
    expectTypeOf(d as t.DeviceObject | undefined).toEqualTypeOf<t.DeviceObject | undefined>();

    const s = Media.toObject(stream);
    expectTypeOf(s as t.StreamObject | undefined).toEqualTypeOf<t.StreamObject | undefined>();

    const tr = Media.toObject({
      id: 't',
      kind: 'audio',
      enabled: true,
      readyState: 'live',
      label: '',
      getSettings: () => ({}) as MediaTrackSettings,
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
    } as unknown as MediaStreamTrack);

    expectTypeOf(tr as t.TrackObject | undefined).toEqualTypeOf<t.TrackObject | undefined>();
  });
});
