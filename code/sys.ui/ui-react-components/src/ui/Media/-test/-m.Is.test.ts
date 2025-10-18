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
});
