import { Subject } from 'npm:rxjs';
import { describe, expect, it } from '../-test.ts';
import { Dispose } from './mod.ts';

describe('Disposable', () => {
  it('disposable', () => {
    const a = Dispose.disposable();
    expect(typeof a.dispose).to.eql('function');
    expect(typeof a.dispose$.subscribe).to.eql('function');
  });

  it('event: dispose$', () => {
    const obj = Dispose.disposable();

    let count = 0;
    obj.dispose$.subscribe(() => count++);

    obj.dispose();
    obj.dispose();
    obj.dispose();
    expect(count).to.eql(1);
  });

  describe('until', () => {
    it('until (single)', () => {
      const a = Dispose.disposable();

      const $ = new Subject<void>();
      const b = Dispose.until(a, $);

      let count = 0;
      a.dispose$.subscribe(() => count++);

      expect(a).to.equal(b);

      $.next();
      $.next();
      $.next();
      expect(count).to.eql(1);
    });

    it('until (list)', () => {
      const a = Dispose.disposable();

      const $1 = new Subject<void>();
      const $2 = new Subject<void>();
      const b = Dispose.until(a, [$1, undefined, $2]);

      let count = 0;
      a.dispose$.subscribe(() => count++);

      expect(a).to.equal(b);

      $1.next();
      $1.next();
      $1.next();
      expect(count).to.eql(1);
    });

    it('until (deep list)', () => {
      const obj1 = Dispose.disposable();
      const $1 = new Subject<void>();
      const $2 = new Subject<void>();
      Dispose.until(obj1, [$1, undefined, [undefined, [undefined, $2]]]);

      let count = 0;
      obj1.dispose$.subscribe(() => count++);

      $2.next();
      $2.next();
      expect(count).to.eql(1);
    });
  });

  describe('done', () => {
    it('fires and completes a subject', () => {
      const dispose$ = new Subject<void>();

      let count = 0;
      dispose$.subscribe(() => count++);

      Dispose.done(dispose$);
      Dispose.done(dispose$);
      Dispose.done(dispose$);

      expect(count).to.eql(1);
    });
  });
});
